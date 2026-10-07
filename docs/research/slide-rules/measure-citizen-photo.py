#!/usr/bin/env python3
"""Read-only measurements of the selected Citizen JY8078-01L photograph.

Requires Pillow and NumPy. Run from any directory; an optional positional path
overrides evidence/citizen-ca-1600.webp next to this script. Prints JSON only.
Never modifies the image, repository sources, or output files.

The manually selected ROIs identify photographed features, not factory drawing
coordinates. Colour thresholds/connected components refine their pixel bounds.
An ellipse fitted to the white graduation-strip edge supplies the photographic
plane, rather than assuming the hand pivot is the calculator-ring centre.
The hollow rate pointer is identified as 60 from operational/visual evidence;
the conversion-group fit enforces the exact unit ratios but does not establish
an exact manufacturer-specified absolute anchor. Lighting, compression, pixel
thresholds and perspective limit precision. Palette samples are photograph
approximations, never original ink specifications. No typography is inferred.
"""

import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image


DEFAULT_SOURCE = Path(__file__).resolve().parent / "evidence/citizen-ca-1600.webp"
SOURCE_SIZE = (1600, 2000)
INITIAL_CENTRE = np.array([750.0, 1000.0])

# [x0, y0, x1, y1], in the original 1600 x 2000 asset. End coordinates exclusive.
POINTER_ROIS = {
    "rate60": (730, 558, 779, 581),
    "KM": (765, 551, 789, 581),
    "NAUT": (263, 1000, 310, 1050),
    "STAT": (275, 820, 331, 878),
}
PALETTE_ROIS = {
    "outerLightInk": ((725, 426, 780, 458), "light"),
    "outerNavySubstrate": ((830, 443, 852, 457), "blue"),
    "fixedBlackTick": ((750, 509, 759, 521), "dark"),
    "yellowInner10Box": ((1165, 900, 1194, 947), "yellow"),
    "yellowKmPointer": ((765, 551, 789, 581), "yellow"),
    "redNautPointer": ((273, 1007, 300, 1037), "red"),
    "redStatPointer": ((299, 837, 325, 863), "red"),
    "fixedBlueNumeralSubstrate": ((817, 557, 837, 565), "blue"),
    "fixedLightSubstrate": ((806, 534, 824, 551), "light"),
    "innerLightInk": ((633, 560, 691, 595), "light"),
    "darkOuter10Digits": ((1278, 874, 1321, 926), "contained-dark"),
    "darkInner10Digits": ((1165, 900, 1194, 947), "contained-dark"),
}
EXCEPTION_ROIS = {
    "inner50": ((513, 549, 541, 579), (524, 571)),
    "inner60": ((743, 498, 761, 521), (755, 515)),
}
MASK_NOTES = {
    "light": "min RGB > 180; RGB spread < 40",
    "blue": "R < 80, G < 110, B < 140; B > G > R",
    "dark": "max RGB < 100",
    "yellow": "R > 130, G > 115, B < 100",
    "red": "R > 130, R > 2*G, R > 2*B",
    "pointer-light": "min RGB > 150; RGB spread < 40",
    "pointer-yellow": "R > 85, G > 85, B < 0.8*G (includes edge pixels)",
    "contained-dark": "max RGB < 100; connected components >= 5 pixels, not touching ROI boundary",
}


def mask_pixels(pixels, role):
    p = pixels.astype(int)
    r, g, b = p[..., 0], p[..., 1], p[..., 2]
    if role in ("light", "pointer-light"):
        floor = 150 if role == "pointer-light" else 180
        return (p.min(axis=-1) > floor) & (p.max(axis=-1) - p.min(axis=-1) < 40)
    if role == "blue":
        return (r < 80) & (g < 110) & (b < 140) & (b > g) & (g > r)
    if role in ("dark", "contained-dark"):
        return p.max(axis=-1) < 100
    if role == "yellow":
        return (r > 130) & (g > 115) & (b < 100)
    if role == "pointer-yellow":
        return (r > 85) & (g > 85) & (b < 0.8 * g)
    if role == "red":
        return (r > 130) & (r > 2 * g) & (r > 2 * b)
    raise ValueError(f"Unknown colour mask: {role}")


def masked_points(image, roi, role):
    x0, y0, x1, y1 = roi
    ys, xs = np.where(mask_pixels(image[y0:y1, x0:x1], role))
    return list(zip((xs + x0).tolist(), (ys + y0).tolist()))


def components(points):
    remaining = set(points)
    found = []
    while remaining:
        pending = [remaining.pop()]
        component = []
        while pending:
            point = pending.pop()
            component.append(point)
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    neighbour = (point[0] + dx, point[1] + dy)
                    if neighbour in remaining:
                        remaining.remove(neighbour)
                        pending.append(neighbour)
        found.append(component)
    return sorted(found, key=len, reverse=True)


def component_record(points):
    a = np.array(points)
    return {
        "pixelCount": len(points),
        "boundsInclusivePx": [a.min(axis=0).tolist(), a.max(axis=0).tolist()],
        "centroidPx": a.mean(axis=0).tolist(),
    }


def graduation_edge_samples(image):
    inner, outer = [], []
    # The longest light radial run identifies the strip, not isolated outer ticks.
    for angle in np.arange(0, 360, 1):
        t = math.radians(angle)
        radii = np.arange(440, 518, 0.5)
        xs = np.round(INITIAL_CENTRE[0] + np.sin(t) * radii).astype(int)
        ys = np.round(INITIAL_CENTRE[1] - np.cos(t) * radii).astype(int)
        p = image[ys, xs].astype(int)
        bright = (p.min(axis=1) > 190) & (p.max(axis=1) - p.min(axis=1) < 45)
        runs, start = [], None
        for i, value in enumerate(bright):
            if value and start is None:
                start = i
            elif not value and start is not None:
                runs.append((start, i))
                start = None
        if start is not None:
            runs.append((start, len(bright)))
        if not runs:
            continue
        first, end = max(runs, key=lambda run: run[1] - run[0])
        if (end - first) * 0.5 < 20:
            continue
        for target, radius in ((inner, radii[first]), (outer, radii[end - 1])):
            target.append((INITIAL_CENTRE + [np.sin(t) * radius, -np.cos(t) * radius]).tolist())
    return inner, outer


def fit_ellipse(points):
    points = np.array(points)
    if len(points) < 20:
        raise ValueError("Too few graduation-strip samples; check the source image.")
    q = (points - INITIAL_CENTRE) / 500
    x, y = q[:, 0], q[:, 1]
    design = np.column_stack([x * x, x * y, y * y, x, y])
    active = np.ones(len(points), dtype=bool)
    for _ in range(4):
        coefficients = np.linalg.lstsq(design[active], np.ones(active.sum()), rcond=None)[0]
        residual = np.abs(design @ coefficients - 1)
        active = residual < max(0.015, np.median(residual) * 3)
    a, b, c, d, e = coefficients
    matrix = np.array([[a, b / 2], [b / 2, c]])
    centre = -0.5 * np.linalg.solve(matrix, [d, e])
    eigenvalues, vectors = np.linalg.eigh(matrix)
    axes = np.sqrt((1 + centre @ matrix @ centre) / eigenvalues) * 500
    centre_px = centre * 500 + INITIAL_CENTRE
    gradient = 2 * np.sqrt((a * x + b * y / 2) ** 2 + (b * x / 2 + c * y) ** 2)
    errors_px = (design @ coefficients - 1) / gradient * 500
    result = {
        "sampleCount": len(points),
        "retainedCount": int(active.sum()),
        "centrePx": centre_px.tolist(),
        "semiaxesPx": axes.tolist(),
        "eigenvectors": vectors.tolist(),
        "medianAbsoluteRadialResidualPx": float(np.median(np.abs(errors_px[active]))),
        "p90AbsoluteRadialResidualPx": float(np.percentile(np.abs(errors_px[active]), 90)),
    }
    # Symmetric whitening preserves the page's orientation while removing ellipticity.
    return result, centre_px, vectors @ np.diag(1 / axes) @ vectors.T


def photo_angle(point, centre, whitening):
    q = whitening @ (np.array(point) - centre)
    return math.degrees(math.atan2(q[0], -q[1])) % 360


def palette_sample(image, roi, role):
    points = masked_points(image, roi, role)
    if role == "contained-dark":
        kept = []
        x0, y0, x1, y1 = roi
        for component in components(points):
            a = np.array(component)
            low, high = a.min(axis=0), a.max(axis=0)
            if (len(component) >= 5 and low[0] > x0 and low[1] > y0
                    and high[0] < x1 - 1 and high[1] < y1 - 1):
                kept.extend(component)
        points = kept
    if not points:
        raise ValueError(f"No {role} pixels in ROI {roi}")
    a = np.array(points)
    values = image[a[:, 1], a[:, 0]]
    median = np.median(values, axis=0)
    return {
        "roiPxExclusiveEnd": list(roi),
        "mask": role,
        "pixelCount": len(values),
        "medianRgb": median.tolist(),
        "approximateHex": "#" + "".join(f"{round(value):02X}" for value in median),
        "p10AndP90Rgb": np.percentile(values, [10, 90], axis=0).tolist(),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", nargs="?", type=Path, default=DEFAULT_SOURCE)
    args = parser.parse_args()
    with Image.open(args.image) as photo:
        if photo.size != SOURCE_SIZE:
            raise ValueError(f"Expected original {SOURCE_SIZE} image, got {photo.size}; ROIs cannot be reused.")
        image = np.array(photo.convert("RGB"))
    inner, outer = graduation_edge_samples(image)
    inner_fit, centre, whitening = fit_ellipse(inner)
    outer_fit, _, _ = fit_ellipse(outer)
    pointers = {}
    for name, roi in POINTER_ROIS.items():
        role = "pointer-light" if name == "rate60" else "pointer-yellow" if name == "KM" else "red"
        chosen = components(masked_points(image, roi, role))[0]
        a = np.array(chosen)
        if name == "rate60":
            apex = a[a[:, 1] == a[:, 1].max()].mean(axis=0)
        elif name == "KM":
            apex = a[a[:, 1] == a[:, 1].min()].mean(axis=0)
        else:
            apex = a[a[:, 0] == a[:, 0].min()].mean(axis=0)
        pointers[name] = {
            **component_record(chosen),
            "roiPxExclusiveEnd": list(roi),
            "mask": role,
            "apexPx": apex.tolist(),
            "ellipseCorrectedAngleClockwiseFromUpDeg": photo_angle(apex, centre, whitening),
        }
    rate_angle = pointers["rate60"]["ellipseCorrectedAngleClockwiseFromUpDeg"]
    observed = {}
    for name in ("KM", "NAUT", "STAT"):
        angle = pointers[name]["ellipseCorrectedAngleClockwiseFromUpDeg"]
        delta = (angle - rate_angle + 180) % 360 - 180
        observed[name] = 60 * 10 ** (delta / 360)
        pointers[name]["observedOffsetFromRate60Deg"] = delta
        pointers[name]["photoDerivedScaleValue"] = observed[name]
    # Equal-weight least-squares angular fit is equivalent to averaging log anchors.
    km = math.exp(np.mean([math.log(observed["KM"]), math.log(observed["NAUT"] * 1.852),
                           math.log(observed["STAT"] * 1.609344)]))
    predicted = {"KM": km, "NAUT": km / 1.852, "STAT": km / 1.609344}
    exceptions = {}
    for name, (roi, seed) in EXCEPTION_ROIS.items():
        choices = components(masked_points(image, roi, "dark"))
        chosen = min(choices, key=lambda points: np.linalg.norm(np.array(points).mean(axis=0) - seed))
        record = component_record(chosen)
        angle = photo_angle(record["centroidPx"], centre, whitening)
        delta = (angle - rate_angle + 180) % 360 - 180
        exceptions[name] = {
            **record, "roiPxExclusiveEnd": list(roi), "manualSelectionSeedPx": list(seed),
            "photoDerivedScaleValue": 60 * 10 ** (delta / 360),
            "interpretation": "Short black square/rectangle above NO or RX; not an ordinary long major tick.",
        }
    result = {
        "source": {"path": str(args.image.resolve()), "sizePx": list(SOURCE_SIZE),
                   "sha256": hashlib.sha256(args.image.read_bytes()).hexdigest().upper()},
        "limitations": {
            "coordinates": "Manual ROIs and threshold-refined apices; approximate +/-2 pixels.",
            "absoluteAnchor": "Photo-fitted only. Nominal KM61.0 +/-0.5 is a disclosed photographic approximation, not factory geometry.",
            "palette": "Reference-derived photographic approximations; not original ink specifications or proven distinct physical inks.",
            "runtime": "Research output only; no source or image modifications and no acceptance gate enabled.",
        },
        "graduationPlane": {"method": "1-degree rays; longest >=20px light run in radii440..518; four robust conic fits.",
                            "innerWhiteEdge": inner_fit, "outerWhiteEdge": outer_fit,
                            "usedForAngles": "innerWhiteEdge"},
        "pointers": pointers,
        "conversionRatioFit": {
            "metresPerNauticalMile": 1852, "metresPerStatuteMile": 1609.344,
            "fittedScaleValues": predicted,
            "angularResidualDeg": {name: 360 * math.log10(observed[name] / predicted[name]) for name in observed},
            "disclosedNominalScaleValues": {"KM": 61, "NAUT": 61 / 1.852, "STAT": 61 / 1.609344},
        },
        "paletteMasks": MASK_NOTES,
        "palette": {name: palette_sample(image, roi, role) for name, (roi, role) in PALETTE_ROIS.items()},
        "innerMajorTickExceptions": exceptions,
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
