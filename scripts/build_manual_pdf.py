from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import ListFlowable, ListItem, PageBreak, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
SOURCES = [
    ROOT / "docs" / "09-manual-usuario" / "01-manual-de-uso.md",
    ROOT / "docs" / "09-manual-usuario" / "03-flujos-principales.md",
]
OUTPUT = ROOT / "apps" / "web" / "public" / "manual" / "manual-de-uso.pdf"


def normalize_inline_markdown(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"`([^`]+)`", r"<font name='Helvetica-Bold'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<font name='Helvetica-Bold'>\1</font>", text)
    return text


def build_styles():
    styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "ManualTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=14,
            alignment=TA_LEFT,
        ),
        "h1": ParagraphStyle(
            "ManualH1",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=10,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "ManualH2",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=colors.HexColor("#1d4ed8"),
            spaceBefore=8,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "ManualBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor("#334155"),
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "ManualBullet",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor("#334155"),
            leftIndent=0,
        ),
    }


def parse_markdown(markdown: str, styles):
    story = []
    bullet_buffer: list[str] = []

    def flush_bullets():
        nonlocal bullet_buffer
        if not bullet_buffer:
            return
        story.append(
            ListFlowable(
                [
                    ListItem(Paragraph(normalize_inline_markdown(item), styles["bullet"]))
                    for item in bullet_buffer
                ],
                bulletType="bullet",
                start="circle",
                leftPadding=14,
            )
        )
        story.append(Spacer(1, 0.18 * cm))
        bullet_buffer = []

    for raw_line in markdown.splitlines():
        line = raw_line.strip()

        if not line:
            flush_bullets()
            story.append(Spacer(1, 0.12 * cm))
            continue

        if line.startswith("# "):
            flush_bullets()
            story.append(Paragraph(normalize_inline_markdown(line[2:]), styles["title"]))
            continue

        if line.startswith("## "):
            flush_bullets()
            story.append(Paragraph(normalize_inline_markdown(line[3:]), styles["h1"]))
            continue

        if line.startswith("### "):
            flush_bullets()
            story.append(Paragraph(normalize_inline_markdown(line[4:]), styles["h2"]))
            continue

        if line.startswith("- "):
            bullet_buffer.append(line[2:])
            continue

        numbered_match = re.match(r"^\d+\.\s+(.*)$", line)
        if numbered_match:
            flush_bullets()
            story.append(Paragraph(normalize_inline_markdown(line), styles["body"]))
            continue

        flush_bullets()
        story.append(Paragraph(normalize_inline_markdown(line), styles["body"]))

    flush_bullets()
    return story


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    styles = build_styles()
    story = []

    for index, source in enumerate(SOURCES):
        story.extend(parse_markdown(source.read_text(encoding="utf-8"), styles))
        if index < len(SOURCES) - 1:
            story.append(PageBreak())

    document = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        title="Manual de uso de TuInventario",
        author="TuInventario",
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.6 * cm,
    )
    document.build(story)
    print(f"PDF generado en: {OUTPUT}")


if __name__ == "__main__":
    build_pdf()
