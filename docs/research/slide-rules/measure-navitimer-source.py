#!/usr/bin/env python3
"""Read-only native-pixel measurements of the selected Navitimer training disc.

The original PDF's page-2 JPEG stream is decoded, never resized or altered.
Manually chosen regions and threshold-derived ellipse/pointer measurements are
photographic reconstruction evidence, not factory dimensions or ink colours.
The low-resolution skewed scan cannot certify individual stroke widths. The
joint concentric-circle model is a disclosed projective approximation, not an
independently proven camera calibration. Logarithmic mathematical angles remain
separate from this approximate photographic registration.

Requires PyMuPDF, Pillow and NumPy. Prints JSON; writes no files.
"""

import argparse
import hashlib
import io
import json
import math
from pathlib import Path

import numpy as np
import pymupdf
from PIL import Image


INITIAL_CENTRE = np.array([361.0, 266.0])
SIZE = (600, 525)
DEFAULT_JPEG = Path(__file__).resolve().parent / "evidence/navitimer-training-disc-native.jpg"
POINTER_ROIS = {
    "MPH60": ((354, 70, 364, 85), "dark", "outward"),
    "KM": ((362, 68, 372, 82), "red", "outward"),
    "NAUT": ((165, 276, 181, 292), "red", "outward"),
    "STAT": ((175, 201, 190, 216), "red", "outward"),
    "innerSeconds36": ((164, 230, 181, 245), "red", "outward"),
    "outerUnlabelledTriangle": ((147, 339, 168, 354), "red", "inward"),
    "outerUnit10": ((507, 126, 521, 142), "red", "inward"),
    "innerUnit10": ((537, 225, 553, 238), "red", "outward"),
    "outer60": ((238, 85, 251, 101), "red", "inward"),
}
PALETTE_ROIS = {
    "blackInk": ((272, 50, 305, 68), "dark"),
    "redOuter60": ((239, 73, 258, 86), "red"),
    "redKmPointer": ((362, 68, 372, 82), "red"),
    "redInner10": ((529, 223, 553, 242), "red"),
    "redOuter10": ((520, 117, 544, 140), "red"),
    "redNautPointer": ((165, 276, 181, 292), "red"),
    "redStatPointer": ((175, 201, 190, 216), "red"),
    "blackMphPointer": ((354, 70, 364, 85), "dark"),
    "blackMphCaption": ((347, 86, 376, 101), "dark"),
    "blackKmCaption": ((381, 84, 406, 102), "dark"),
    "blackNautCaption": ((177, 279, 202, 316), "dark"),
    "blackStatCaption": ((183, 215, 205, 247), "dark"),
    "lightOuterSubstrate": ((350, 40, 359, 53), "light"),
    "lightFixedSubstrate": ((377, 93, 389, 105), "light"),
}
# Independent manual review of actual fixed-row strokes, not numeral centres.
# Rough mid-stroke anchors +/-2px were supplied by the inner graduation reviewer.
FIXED_MAJOR_ANCHORS = [(15, 479, 419), (20, 338, 456), (25, 234, 408),
                       (30, 181, 332), (35, 171, 252), (40, 190, 185),
                       (45, 227, 134), (50, 270, 102), (55, 316, 84)]
PROFILE_ROIS = {
    "outerMajor70": ((329, 58, 336, 68), "tick"),
    "outerMinorNear71": ((339, 60, 344, 68), "tick"),
    "outerMajor65": ((287, 67, 296, 79), "tick"),
    "outerNumeral70": ((316, 39, 346, 59), "glyph-run"),
    "outerNumeral75": ((362, 38, 388, 59), "glyph-run"),
}


def colour_mask(p, role):
    p = p.astype(int)
    r, g, b = p[..., 0], p[..., 1], p[..., 2]
    if role == "dark":
        return p.max(axis=-1) < 80
    if role == "red":
        return (r > 130) & (r > 1.65 * g) & (r > 1.65 * b)
    if role == "light":
        return (p.min(axis=-1) > 105) & (p.max(axis=-1) - p.min(axis=-1) < 65)
    raise ValueError(role)


def components(points):
    remaining = set(points)
    result = []
    while remaining:
        todo = [remaining.pop()]
        found = []
        while todo:
            x, y = todo.pop()
            found.append((x, y))
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    neighbour = (x + dx, y + dy)
                    if neighbour in remaining:
                        remaining.remove(neighbour)
                        todo.append(neighbour)
        result.append(found)
    return sorted(result, key=len, reverse=True)


def roi_points(image, roi, role):
    x0, y0, x1, y1 = roi
    ys, xs = np.where(colour_mask(image[y0:y1, x0:x1], role))
    return list(zip((xs + x0).tolist(), (ys + y0).tolist()))


def edge_samples(image):
    inner, outer = [], []
    for degrees in range(360):
        t = math.radians(degrees)
        direction = np.array([math.sin(t), -math.cos(t)])
        radii = np.arange(140, 269, 0.5)
        coords = np.rint(INITIAL_CENTRE + radii[:, None] * direction).astype(int)
        valid = (coords[:, 0] >= 0) & (coords[:, 0] < SIZE[0]) & (coords[:, 1] >= 0) & (coords[:, 1] < SIZE[1])
        coords, radii = coords[valid], radii[valid]
        p = image[coords[:, 1], coords[:, 0]].astype(int)
        light = colour_mask(p, "light")
        starts = [i for i in range(len(light) - 10)
                  if 145 <= radii[i] <= 173 and light[i:i + 10].all()]
        if starts:
            inner.append((INITIAL_CENTRE + radii[starts[0]] * direction).tolist())
        choices = [i for i in range(len(light) - 1)
                   if 225 <= radii[i] <= 262 and light[i] and not light[i + 1]]
        if choices:
            outer.append((INITIAL_CENTRE + radii[choices[-1]] * direction).tolist())
    return inner, outer


def fit_ellipse(points):
    points = np.asarray(points)
    q = (points - INITIAL_CENTRE) / 250
    x, y = q[:, 0], q[:, 1]
    design = np.column_stack([x * x, x * y, y * y, x, y])
    active = np.ones(len(points), dtype=bool)
    for _ in range(5):
        coef = np.linalg.lstsq(design[active], np.ones(active.sum()), rcond=None)[0]
        residual = np.abs(design @ coef - 1)
        active = residual < max(0.02, np.median(residual) * 3)
    a, b, c, d, e = coef
    matrix = np.array([[a, b / 2], [b / 2, c]])
    centre = -0.5 * np.linalg.solve(matrix, [d, e])
    eigenvalues, vectors = np.linalg.eigh(matrix)
    axes = np.sqrt((1 + centre @ matrix @ centre) / eigenvalues) * 250
    centre_px = centre * 250 + INITIAL_CENTRE
    whitening = vectors @ np.diag(1 / axes) @ vectors.T
    gradient = 2 * np.sqrt((a * x + b * y / 2) ** 2 + (b * x / 2 + c * y) ** 2)
    errors = (design @ coef - 1) / gradient * 250
    return {
        "sampleCount": len(points), "retainedCount": int(active.sum()),
        "centrePx": centre_px.tolist(), "semiaxesPx": axes.tolist(),
        "eigenvectors": vectors.tolist(), "whiteningMatrix": whitening.tolist(),
        "medianAbsoluteRadialResidualPx": float(np.median(np.abs(errors[active]))),
        "p90AbsoluteRadialResidualPx": float(np.percentile(np.abs(errors[active]), 90)),
    }, centre_px, whitening


def angle(point, centre, whitening):
    q = whitening @ (np.asarray(point) - centre)
    return math.degrees(math.atan2(q[0], -q[1])) % 360


def fit_concentric_projective(inner, outer, outer_fit):
    """Fit an assumed pair of concentric circles, never infer tick mathematics.

    The outer circle radius is one. A symmetric positive affine part removes
    arbitrary rotation; the projective denominator captures the apparent
    nonconcentric centres in the scan. A finite-difference Gauss-Newton solve
    keeps this helper reproducible with NumPy alone. This is a model assumption,
    not independent proof that the photograph is a factory-calibrated plane.
    """
    points = np.vstack([inner, outer])
    normalised = (points - INITIAL_CENTRE) / 250
    inner_count = len(inner)
    w = np.array(outer_fit["whiteningMatrix"]) * 250
    t = (np.array(outer_fit["centrePx"]) - INITIAL_CENTRE) / 250
    params = np.array([*t, w[0, 0], w[0, 1], w[1, 1], 0, 0, 157.3 / 238.8])

    def residual(p):
        q = normalised - p[:2]
        transform = np.array([[p[2], p[3]], [p[3], p[4]]])
        mapped = (q @ transform.T) / (1 + q @ p[5:7])[:, None]
        target = np.ones(len(q))
        target[:inner_count] = p[7]
        return np.linalg.norm(mapped, axis=1) - target

    for _ in range(40):
        values = residual(params)
        weights = np.minimum(1, 0.008 / np.maximum(np.abs(values), 1e-12))
        jacobian = np.column_stack([(residual(params + np.eye(8)[i] * 1e-6) - values) / 1e-6 for i in range(8)])
        delta = np.linalg.lstsq(jacobian * np.sqrt(weights)[:, None], -values * np.sqrt(weights), rcond=None)[0]
        old_loss = float(np.sum(weights * values * values))
        accepted = False
        for fraction in (1, 0.5, 0.25, 0.125, 0.0625):
            candidate = params + fraction * delta
            new_values = residual(candidate)
            if float(np.sum(weights * new_values * new_values)) < old_loss:
                params = candidate
                accepted = True
                break
        if not accepted or np.linalg.norm(delta) < 1e-10:
            break
    values = residual(params)
    centre = INITIAL_CENTRE + params[:2] * 250
    transform = np.array([[params[2], params[3]], [params[3], params[4]]]) / 250
    errors_px = np.abs(values) * 239
    return {
        "assumption": "Visible outer white circle and inner black circle were concentric in the photographed source plane; not a proven factory camera model",
        "method": "Joint robust Gauss-Newton fit of two concentric circles; symmetric affine part fixes arbitrary rotation",
        "centrePx": centre.tolist(), "angleTransformPerPx": transform.tolist(),
        "perspectiveVectorNormalised": params[5:7].tolist(),
        "innerToOuterRadiusRatio": float(params[7]),
        "medianAbsoluteRadialResidualPx": float(np.median(errors_px)),
        "p90AbsoluteRadialResidualPx": float(np.percentile(errors_px, 90)),
        "innerMedianResidualPx": float(np.median(errors_px[:inner_count])),
        "outerMedianResidualPx": float(np.median(errors_px[inner_count:])),
    }, centre, transform


def fit_known_fixed_angles(pointers):
    """Independent sensitivity check using manually reviewed major strokes.

    Solve the linear angular constraints for an affine numerator: a projective
    denominator does not change polar angles. This empirically registers the
    supplied mathematical identities; it is not independent tick-count proof.
    Nine rough native anchors cannot recover an exact factory camera model.
    """
    design = []
    for value, x, y in FIXED_MAJOR_ANCHORS:
        point = np.array([x, y]) - INITIAL_CENTRE
        theta = 2 * math.pi * math.log10(value / 10)
        sx, sy = math.sin(theta), -math.cos(theta)
        design.append([sy * point[0], sy * point[1], -sx * point[0], -sx * point[1], sy, -sx])
    _, singular, vectors = np.linalg.svd(np.array(design))
    solution = vectors[-1]
    transform = solution[:4].reshape(2, 2)
    centre = INITIAL_CENTRE - np.linalg.solve(transform, solution[4:])
    first_value, first_x, first_y = FIXED_MAJOR_ANCHORS[0]
    theta = 2 * math.pi * math.log10(first_value / 10)
    if np.dot(transform @ (np.array([first_x, first_y]) - centre), [math.sin(theta), -math.cos(theta)]) < 0:
        transform = -transform
    transform /= math.sqrt(abs(np.linalg.det(transform)))
    anchors = []
    for value, x, y in FIXED_MAJOR_ANCHORS:
        measured = angle([x, y], centre, transform)
        expected = 360 * math.log10(value / 10)
        anchors.append({"value": value, "sourcePointPx": [x, y], "estimatedPointUncertaintyPx": 2,
                        "angularResidualDeg": (measured - expected + 180) % 360 - 180})
    source_pointers = {}
    for name, record in pointers.items():
        degrees = angle(record["apexPx"], centre, transform)
        source_pointers[name] = {"logicalAngleDeg": degrees, "photoDerivedRawDecadeValue": 10 * 10 ** (degrees / 360)}
    km = math.exp(np.mean([math.log(source_pointers["KM"]["photoDerivedRawDecadeValue"]),
                           math.log(source_pointers["NAUT"]["photoDerivedRawDecadeValue"] * 1.852),
                           math.log(source_pointers["STAT"]["photoDerivedRawDecadeValue"] * 1.609344)]))
    fitted = {"KM": km, "NAUT": km / 1.852, "STAT": km / 1.609344}
    extra_angle = (source_pointers["outerUnlabelledTriangle"]["logicalAngleDeg"] - source_pointers["outerUnit10"]["logicalAngleDeg"]) % 360
    return {
        "method": "Linear SVD angular fit to nine independently reviewed fixed major-stroke midpoints; mathematical identities supplied, not discovered by this fit",
        "notTickInventoryProof": True, "notFactoryCalibration": True,
        "centrePx": centre.tolist(), "angleTransform": transform.tolist(),
        "singularValues": singular.tolist(), "anchors": anchors,
        "maxAbsoluteAnchorAngularResidualDeg": max(abs(a["angularResidualDeg"]) for a in anchors),
        "pointerComparison": source_pointers, "conversionFittedScaleValues": fitted,
        "conversionAngularResidualDeg": {name: 360 * math.log10(source_pointers[name]["photoDerivedRawDecadeValue"] / fitted[name]) for name in fitted},
        "outerUnlabelledTriangleValueRelativeToOuter10": 10 * 10 ** (extra_angle / 360),
        "extraValidationPointNotFitted": {"identity": 11, "sourcePointPx": [553, 278], "estimatedPointUncertaintyPx": 1,
                                          "angularResidualDeg": (angle([553, 278], centre, transform) - 360 * math.log10(1.1) + 180) % 360 - 180},
    }


def pointer(image, roi, role, direction, centre, whitening):
    groups = components(roi_points(image, roi, role))
    if not groups:
        raise ValueError(f"No {role} component at {roi}")
    p = np.array(groups[0])
    radii = np.linalg.norm((p - centre) @ whitening.T, axis=1)
    extremum = radii.max() if direction == "outward" else radii.min()
    apex = p[np.abs(radii - extremum) < 0.003].mean(axis=0)
    return {
        "roiPxExclusiveEnd": list(roi), "mask": role, "pixelCount": len(p),
        "boundsInclusivePx": [p.min(axis=0).tolist(), p.max(axis=0).tolist()],
        "apexPx": apex.tolist(), "direction": direction,
        "modelCorrectedAngleClockwiseFromUpDeg": angle(apex, centre, whitening),
        "estimatedApexUncertaintyPx": 2,
    }


def palette(image, roi, role):
    p = np.array(roi_points(image, roi, role))
    values = image[p[:, 1], p[:, 0]]
    rgb = np.median(values, axis=0)
    return {
        "roiPxExclusiveEnd": list(roi), "mask": role, "pixelCount": len(p),
        "medianRgb": rgb.tolist(), "approximateHex": "#" + "".join(f"{round(x):02X}" for x in rgb),
        "p10AndP90Rgb": np.percentile(values, [10, 90], axis=0).tolist(),
    }


def profile(image, roi, kind):
    groups = components(roi_points(image, roi, "dark"))
    if kind == "tick":
        points = np.array(groups[0])
    else:
        points = np.array([point for group in groups if len(group) >= 3 for point in group])
    centre = points.mean(axis=0)
    _, vectors = np.linalg.eigh(np.cov((points - centre).T))
    projected = (points - centre) @ vectors
    spans = np.ptp(projected, axis=0) + 1
    return {
        "roiPxExclusiveEnd": list(roi), "mask": "dark", "kind": kind,
        "pixelCount": len(points), "boundsInclusivePx": [points.min(axis=0).tolist(), points.max(axis=0).tolist()],
        "pcaMajorMinorExtentPx": sorted(spans.tolist(), reverse=True),
        "measurementUncertaintyPx": 2,
        "interpretation": "Threshold-connected photographic extent only; a 1-2px minor stroke is undersampled, and glyph-run PCA is not font cap height or baseline",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path, nargs="?", default=DEFAULT_JPEG)
    parser.add_argument("--pdf", type=Path, help="Optionally verify the original PDF and use its original page-2 JPEG stream instead")
    args = parser.parse_args()
    pdf_source = None
    if args.pdf:
        with pymupdf.open(args.pdf) as doc:
            candidates = [i for i in doc[1].get_images(full=True) if (i[2], i[3]) == SIZE]
            if len(candidates) != 1:
                raise ValueError("Expected exactly one 600x525 native page-2 image")
            xref = candidates[0][0]
            raw = doc.xref_stream_raw(xref)
            pdf_source = {"path": str(args.pdf.resolve()), "sha256": hashlib.sha256(args.pdf.read_bytes()).hexdigest().upper(),
                          "viewerPage": 2, "imageXref": xref, "streamFilter": candidates[0][8]}
    else:
        raw = args.image.read_bytes()
    with Image.open(io.BytesIO(raw)) as decoded:
        image = np.array(decoded.convert("RGB"))
        decoder_format = decoded.format
        icc_bytes = len(decoded.info.get("icc_profile", b""))
    if tuple(image.shape[:2][::-1]) != SIZE:
        raise ValueError("Unexpected native image dimensions")
    inner_points, outer_points = edge_samples(image)
    inner_fit, _, _ = fit_ellipse(inner_points)
    outer_fit, _, _ = fit_ellipse(outer_points)
    projective_fit, centre, whitening = fit_concentric_projective(inner_points, outer_points, outer_fit)
    pointers = {name: pointer(image, roi, role, direction, centre, whitening)
                for name, (roi, role, direction) in POINTER_ROIS.items()}
    rate_angle = pointers["MPH60"]["modelCorrectedAngleClockwiseFromUpDeg"]
    observed = {}
    for name in ("KM", "NAUT", "STAT", "innerSeconds36", "innerUnit10"):
        delta = (pointers[name]["modelCorrectedAngleClockwiseFromUpDeg"] - rate_angle + 180) % 360 - 180
        value = 60 * 10 ** (delta / 360)
        observed[name] = value
        pointers[name]["observedOffsetFromRate60Deg"] = delta
        pointers[name]["photoDerivedScaleValue"] = value
        pointers[name]["photoDerivedRawDecadeValue"] = value
        pointers[name]["photoDerivedNormalizedScaleValue"] = value / (10 if value >= 100 else 1)
        if name == "innerUnit10":
            pointers[name]["sourceMathematicalIdentity"] = 10
            pointers[name]["normalizationNote"] = "Near-unit photograph fits may slightly exceed100; normalized estimate is distinct from exact source identity10, never a second100 graduation"
    km = math.exp(np.mean([math.log(observed["KM"]), math.log(observed["NAUT"] * 1.852),
                           math.log(observed["STAT"] * 1.609344)]))
    predicted = {"KM": km, "NAUT": km / 1.852, "STAT": km / 1.609344}
    outer_unit_angle = pointers["outerUnit10"]["modelCorrectedAngleClockwiseFromUpDeg"]
    outer_extra_delta = (pointers["outerUnlabelledTriangle"]["modelCorrectedAngleClockwiseFromUpDeg"] - outer_unit_angle) % 360
    pointers["outerUnlabelledTriangle"]["photoDerivedScaleValue"] = 10 * 10 ** (outer_extra_delta / 360)
    empirical = fit_known_fixed_angles(pointers)
    result = {
        "source": {"imagePath": str(args.image.resolve()) if not args.pdf else None, "pdf": pdf_source,
                   "streamBytes": len(raw), "streamSha256": hashlib.sha256(raw).hexdigest().upper(),
                   "decoderFormat": decoder_format, "iccProfileBytes": icc_bytes, "sizePx": list(SIZE),
                   "decodePolicy": "Original JPEG bytes decoded with Pillow; no ICC transformation, alteration or resizing"},
        "limitations": ["Source is a low-resolution skewed training-disc scan, not engineering artwork or a particular watch model.",
                        "Concentric-circle projective fitting is a disclosed model assumption, not an independently calibrated factory plane.",
                        "Pixel apices have +/-2px uncertainty; absolute conversion anchor is a reconstruction estimate, not a manufacturer value.",
                        "RGB/hex are scan approximations only, not original ink specifications.",
                        "Individual widths at 1-2px are undersampled; retain ranges rather than claim exact widths."],
        "graduationPlane": {"method": "Threshold-derived light annulus edges on 1deg rays; individual robust conic fits and joint concentric-circle projective model",
                            "innerBoundary": inner_fit, "outerBoundary": outer_fit, "concentricProjectiveFit": projective_fit},
        "pointers": pointers,
        "conversionRatioFit": {"metresPerNauticalMile": 1852, "metresPerStatuteMile": 1609.344,
                               "fittedScaleValues": predicted,
                               "angularResidualDeg": {name: 360 * math.log10(observed[name] / predicted[name]) for name in predicted}},
        "sourceRegistration": {"fixedUnitAnglePhotoDerivedDeg": (rate_angle - 360 * math.log10(6)) % 360,
                               "outerUnitAnglePhotoDerivedDeg": outer_unit_angle,
                               "outerRelativeRotationPhotoDerivedDeg": (outer_unit_angle - rate_angle + 360 * math.log10(6)) % 360,
                               "notRuntimeDefault": True},
        "independentFixedAnchorSensitivityCheck": empirical,
        "modelSensitivity": {"concentricCircleKmAnchor": km,
                             "independentMajorStrokeKmAnchor": empirical["conversionFittedScaleValues"]["KM"],
                             "kmAnchorDifference": km - empirical["conversionFittedScaleValues"]["KM"],
                             "interpretation": "Model/source-apex sensitivity precludes exact absolute-anchor claims; nominalKM61 +/-1 is a reconstruction estimate only, and all conversion pointers must share exact ratios"},
        "paletteMasks": {"dark": "maxRGB<80", "red": "R>130, R>1.65G, R>1.65B",
                         "light": "minRGB>105, RGBspread<65"},
        "palette": {name: palette(image, roi, role) for name, (roi, role) in PALETTE_ROIS.items()},
        "representativePixelProfiles": {name: profile(image, roi, kind) for name, (roi, kind) in PROFILE_ROIS.items()},
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
