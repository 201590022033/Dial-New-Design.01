"""Retain production vector artwork at 1:1; never emit machine power/speed defaults."""
from pathlib import Path
from io import BytesIO
import xml.etree.ElementTree as ET
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from pypdf import PdfReader, PdfWriter, Transformation

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/pdf"
OUT.mkdir(parents=True, exist_ok=True)
sheet = BytesIO()
c = canvas.Canvas(sheet, pagesize=A4)
c.setTitle("Dial Designer - 1:1 aviation laser test sheet")
c.setAuthor("Dial Designer")

def text(x, y, value, size=9, font="Helvetica"):
    c.setFont(font, size)
    c.drawString(x * mm, y * mm, value)

text(18, 280, "AVIATION SCALE / LASER TEST SHEET", 17, "Helvetica-Bold")
text(18, 273, "09 October 2026 | A4 | Print Actual Size / 100% - NEVER Fit to Page", 9)
text(18, 267, "Verify the 100mm bar before using any dimensional result. Reference artwork is not machine code.", 8)
text(25, 256, "A / Decimal hour", 11, "Helvetica-Bold")
text(120, 256, "B / Knots / statute MPH", 11, "Helvetica-Bold")
text(25, 206, "42 x 42mm artwork frame", 8)
text(120, 206, "42 x 42mm artwork frame", 8)
text(25, 201, "100 ticks; 0.01h = 36s; one seam", 8)
text(120, 201, "0-200kt / 300-degree linear sweep", 8)
text(18, 191, "Production vectors above retain white/red ink on a dark VIEWING background.", 8)
text(18, 186, "Use the separate monochrome SVGs for engraving preparation. Do not engrave these backgrounds.", 8)
text(18, 176, "DIMENSION CHECK / measure between the two end marks", 9, "Helvetica-Bold")
c.setStrokeColorRGB(0, 0, 0)
c.setLineWidth(.15 * mm)
c.line(25 * mm, 166 * mm, 125 * mm, 166 * mm)
for x in (25, 125):
    c.line(x * mm, 164 * mm, x * mm, 168 * mm)
text(68, 160, "100.00mm", 8)
text(145, 170, "20 x 20mm square", 8)
c.rect(145 * mm, 146 * mm, 20 * mm, 20 * mm)
text(18, 150, "STROKE COUPONS (mm)", 9, "Helvetica-Bold")
for index, width in enumerate((.05, .08, .10, .15, .20, .30)):
    x = 20 + index * 19
    text(x, 143, f"{width:.2f}", 8)
    c.setLineWidth(width * mm)
    c.line(x * mm, 138 * mm, (x + 12) * mm, 138 * mm)
text(18, 127, "NOMINAL FONT-SIZE COUPONS (mm; not measured cap height)", 9, "Helvetica-Bold")
for index, height in enumerate((.25, .30, .40, .50, .60, .80)):
    x = 20 + index * 28
    text(x, 121, f"{height:.2f}", 8)
    text(x, 116, "0.50 115.1mph", height * mm, "Helvetica-Bold")
text(18, 105, "TEST RECORD / no power, speed, passes or material compatibility are prescribed", 9, "Helvetica-Bold")
for y, label in ((98, "Machine / lens: _____________  Material / finish / thickness: __________________"),
                 (90, "Sample ID: _____________  Operation / power / speed / passes: _________________"),
                 (82, "Measured bar: ______mm  Smallest legible text: ______mm  Stroke: ______mm"),
                 (74, "Contrast / coating / kerf / damage observations: _____________________________"),
                 (66, "Decision / operator / date: __________________________________________________")):
    text(18, y, label, 9)
text(18, 53, "PREPARATION CHECKLIST", 9, "Helvetica-Bold")
for y, line in ((47, "[ ] Outline SVG text in the manufacturing application; recheck dimensions and glyph spacing."),
                (42, "[ ] Assign engraving vs cutting explicitly; suppress notes, coupons and frame/background fills."),
                (37, "[ ] Use a scrap sample and the machine/material manufacturer's operating procedures."),
                (32, "[ ] Check actual annulus fit: this is a pilot chapter-ring specimen, not a supplier-fit certificate."),
                (27, "[ ] This is not an hour timer, automatic Hobbs record, or operational navigation approval.")):
    text(18, y, line, 8)
text(18, 17, "Source: committed Milestone 5 production exports, 6c7204d. Font substitution disclosed. Page 1 / 1.", 8)
c.save()

page = PdfReader(sheet).pages[0]
for name, x in (("decimal-hour", 25), ("knots-mph", 120)):
    source = PdfReader(OUT / f"m5-{name}.pdf").pages[0]
    assert abs(float(source.mediabox.width) / mm - 42) < .001
    assert abs(float(source.mediabox.height) / mm - 42) < .001
    page.merge_transformed_page(source, Transformation().translate(x * mm, 212 * mm), expand=False)
    # Colours deliberately collapsed to one engraving role. Calibration and
    # strokes are unchanged; no substrate or frame is introduced.
    root = ET.parse(OUT / f"m5-{name}.svg").getroot()
    for element in root.iter():
        for role in ("fill", "stroke"):
            colour = element.get(role)
            if colour and colour not in ("none", "transparent"):
                element.set(role, "#000000")
    root.set("data-manufacturing-status", "test-only-outline-text-and-assign-operations")
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    ET.ElementTree(root).write(OUT / f"laser-test-{name}.svg", encoding="utf-8", xml_declaration=True)
    checked = ET.parse(OUT / f"laser-test-{name}.svg").getroot()
    original = ET.parse(OUT / f"m5-{name}.svg").getroot()
    assert len(list(original.iter())) == len(list(checked.iter()))
    for before, after in zip(original.iter(), checked.iter()):
        assert before.tag == after.tag and before.text == after.text
        # Recolouring must not modify any coordinate, unit, clip, ID or typography.
        keys = (set(before.attrib) | set(after.attrib)) - {"fill", "stroke", "data-manufacturing-status"}
        assert all(before.get(key) == after.get(key) for key in keys)
writer = PdfWriter()
writer.add_page(page)
writer.add_metadata({"/Title": "Dial Designer - 1:1 aviation laser test sheet", "/Subject": "A4 test worksheet; vectors preserved at 42mm; not machine-ready"})
destination = OUT / "aviation-laser-test-sheet.pdf"
with destination.open("wb") as target:
    writer.write(target)
check = PdfReader(destination)
assert len(check.pages) == 1
assert abs(float(check.pages[0].mediabox.width) / mm - 210) < .001
assert abs(float(check.pages[0].mediabox.height) / mm - 297) < .001
assert "100.00mm" in check.pages[0].extract_text()
assert len(list(check.pages[0].images)) == 0  # Actual vectors, not screenshots.
print(f"Verified A4, one page, two unscaled 42mm vector specimens: {destination}")
