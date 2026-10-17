#!/usr/bin/env python3
"""Minimal, dependency-free Markdown -> HTML converter for the MYDR24 spec PDF.

Supports: ATX headings, pipe tables, fenced code, blockquotes, nested ordered/unordered
lists (incl. task boxes), horizontal rules, paragraphs, and inline bold/italic/code/links.
Usage: python3 md2html.py out.html "Cover title" "Subtitle" part1.md:"Label" part2.md:"Label" ...
"""
import html
import re
import sys

INLINE_CODE = re.compile(r"`([^`]+)`")
LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
BOLD = re.compile(r"\*\*(.+?)\*\*")
ITAL = re.compile(r"(?<![\*\w])\*(?!\s)(.+?)(?<!\s)\*(?![\*\w])")


# The sandbox only ships "Noto Sans", which lacks arrows, box-drawing, emoji and some math
# glyphs. Replace them with ASCII (inside code blocks, keeping column alignment) or with
# CSS/SVG-drawn equivalents (in body text) so nothing renders as blank boxes.
SVG_ARROW = '<svg class="ar" viewBox="0 0 14 8"><path d="M0 4h12M9 1l3 3-3 3"/></svg>'
SVG_DARROW = '<svg class="ar" viewBox="0 0 16 8"><path d="M1 4h14M4 1L1 4l3 3M12 1l3 3-3 3"/></svg>'
SVG_UP = '<svg class="ar v" viewBox="0 0 8 12"><path d="M4 12V1M1 4l3-3 3 3"/></svg>'
SVG_DOWN = '<svg class="ar v" viewBox="0 0 8 12"><path d="M4 0v11M1 8l3 3 3-3"/></svg>'
TEXT_SUBS = {
    "→": SVG_ARROW, "↔": SVG_DARROW, "↑": SVG_UP, "↓": SVG_DOWN,
    "▶": SVG_ARROW, "◀": "‹", "▼": SVG_DOWN, "▲": SVG_UP,
    "≤": "&lt;=", "≥": "&gt;=", "≠": "≠", "≈": "~", "∈": "in",
    "✅": '<span class="ic ok"></span>', "✖": '<span class="ic no">×</span>',
    "⚠": '<span class="ic warn">!</span>', "🔴": '<span class="dot red"></span>',
    "🟠": '<span class="dot orange"></span>', "🟡": '<span class="dot yellow"></span>',
    "🟢": '<span class="dot green"></span>', "●": '<span class="dot dark"></span>',
    "○": '<span class="dot hollow"></span>', "◐": '<span class="dot half"></span>',
    "☐": '<span class="cb"></span>', "☑": '<span class="cb on"></span>',
    "🔒": '<span class="tag">Locked</span>', "⏳": '<span class="tag amber">Pending</span>',
    "【": "[", "】": "]",
}
TEXT_SUBS["≠"] = "!="
PRE_SUBS = {"─": "-", "│": "|", "┌": "+", "┐": "+", "└": "+", "┘": "+", "├": "+", "┤": "+",
            "┬": "+", "┴": "+", "┼": "+", "▶": ">", "◀": "<", "▼": "v", "▲": "^", "→": ">",
            "↔": "=", "≤": "<", "≥": ">", "≠": "#", "≈": "~", "↑": "^", "↓": "v"}


def text_subs(s: str) -> str:
    return "".join(TEXT_SUBS.get(ch, ch) for ch in s)


def pre_subs(s: str) -> str:
    return "".join(PRE_SUBS.get(ch, ch) for ch in s)


def inline(text: str) -> str:
    codes = []

    def stash(m):
        codes.append(m.group(1))
        return f"\x00{len(codes) - 1}\x00"

    text = INLINE_CODE.sub(stash, text)
    text = html.escape(text, quote=False)
    text = LINK.sub(lambda m: f'<a href="{m.group(2)}">{m.group(1)}</a>', text)
    text = BOLD.sub(r"<strong>\1</strong>", text)
    text = ITAL.sub(r"<em>\1</em>", text)
    text = text_subs(text)
    return re.sub(r"\x00(\d+)\x00", lambda m: f"<code>{text_subs(html.escape(codes[int(m.group(1))]))}</code>", text)


def slug(text, prefix):
    s = re.sub(r"[^a-z0-9]+", "-", re.sub(r"<[^>]+>", "", text).lower()).strip("-")
    return f"{prefix}-{s}"[:80]


def split_row(line):
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    cells, cur, in_code = [], "", False
    for ch in line:
        if ch == "`":
            in_code = not in_code
        if ch == "|" and not in_code:
            cells.append(cur)
            cur = ""
        else:
            cur += ch
    cells.append(cur)
    return [c.strip() for c in cells]


LIST_RE = re.compile(r"^(\s*)([-*]|\d+\.)\s+(.*)$")


def convert(md: str, prefix: str, toc: list) -> str:
    lines = md.split("\n")
    out, i, n = [], 0, len(lines)
    para = []

    def flush_para():
        if para:
            out.append("<p>" + inline(" ".join(p.strip() for p in para)) + "</p>")
            para.clear()

    while i < n:
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            flush_para()
            i += 1
            buf = []
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            # No monospace font is installed, so emulate fixed-width cells per character
            # to keep ASCII diagrams aligned.
            rows = []
            for ln in pre_subs("\n".join(buf)).split("\n"):
                cells = "".join(
                    '<i> </i>' if ch == " " else f"<i>{html.escape(ch)}</i>" for ch in ln.rstrip()
                )
                rows.append(f'<div class="ml">{cells or "<i> </i>"}</div>')
            out.append('<div class="pre">' + "".join(rows) + "</div>")
            continue

        m = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if m:
            flush_para()
            level = len(m.group(1))
            content = inline(m.group(2))
            hid = slug(m.group(2), prefix)
            if level <= 2:
                toc.append((level, content, hid))
            out.append(f'<h{level} id="{hid}">{content}</h{level}>')
            i += 1
            continue

        if re.match(r"^(-{3,}|\*{3,})$", stripped):
            flush_para()
            out.append("<hr/>")
            i += 1
            continue

        if stripped.startswith("|") and i + 1 < n and re.match(r"^\s*\|?\s*:?-{2,}", lines[i + 1]):
            flush_para()
            header = split_row(lines[i])
            i += 2
            rows = []
            while i < n and lines[i].strip().startswith("|"):
                rows.append(split_row(lines[i]))
                i += 1
            cls = "wide" if len(header) >= 7 else ""
            t = [f'<table class="{cls}"><thead><tr>' + "".join(f"<th>{inline(h)}</th>" for h in header) + "</tr></thead><tbody>"]
            for r in rows:
                r = (r + [""] * len(header))[: len(header)]
                t.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>")
            t.append("</tbody></table>")
            out.append("".join(t))
            continue

        if stripped.startswith(">"):
            flush_para()
            buf = []
            while i < n and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip()[1:].strip())
                i += 1
            out.append("<blockquote>" + convert("\n".join(buf), prefix + "q", []) + "</blockquote>")
            continue

        if LIST_RE.match(line):
            flush_para()
            items = []  # (indent, ordered, text)
            while i < n:
                lm = LIST_RE.match(lines[i])
                if lm:
                    items.append([len(lm.group(1).expandtabs(4)), lm.group(2)[-1] == ".", lm.group(3)])
                    i += 1
                elif lines[i].strip() and items and lines[i].startswith("  ") and not lines[i].strip().startswith("|"):
                    items[-1][2] += " " + lines[i].strip()
                    i += 1
                elif not lines[i].strip() and i + 1 < n and LIST_RE.match(lines[i + 1]) and LIST_RE.match(lines[i + 1]).group(1):
                    i += 1
                else:
                    break
            # nested table inside list (indented pipe rows) handled by falling through next loop
            stack, html_parts = [], []
            for indent, ordered, text in items:
                tag = "ol" if ordered else "ul"
                while stack and indent < stack[-1][0]:
                    html_parts.append(f"</li></{stack.pop()[1]}>")
                if not stack or indent > stack[-1][0]:
                    html_parts.append(f"<{tag}>")
                    stack.append((indent, tag))
                else:
                    html_parts.append("</li>")
                box = ""
                tm = re.match(r"^\[( |x|X)\]\s+(.*)$", text)
                if tm:
                    box = '<span class="cb on"></span> ' if tm.group(1).lower() == "x" else '<span class="cb"></span> '
                    text = tm.group(2)
                html_parts.append("<li>" + box + inline(text))
            while stack:
                html_parts.append(f"</li></{stack.pop()[1]}>")
            out.append("".join(html_parts))
            continue

        if not stripped:
            flush_para()
            i += 1
            continue

        # indented table lines inside lists
        if stripped.startswith("|") and line != stripped:
            lines[i] = stripped
            continue

        para.append(line)
        i += 1

    flush_para()
    return "\n".join(out)


CSS = """
@page { size: A4; }
* { box-sizing: border-box; }
body { font-family: 'Noto Sans', sans-serif; color: #1D2939; font-size: 9.2pt; line-height: 1.45; margin: 0; }
h1 { color: #0B5FD7; font-size: 18pt; border-bottom: 3px solid #0B5FD7; padding-bottom: 4px; margin: 0 0 10px; }
h2 { color: #0B5FD7; font-size: 13.5pt; margin: 18px 0 6px; border-bottom: 1px solid #D0D5DD; padding-bottom: 2px; break-after: avoid; }
h3 { color: #1849A9; font-size: 11pt; margin: 14px 0 4px; break-after: avoid; }
h4 { color: #344054; font-size: 10pt; margin: 12px 0 4px; break-after: avoid; }
p { margin: 4px 0 6px; }
a { color: #0B5FD7; text-decoration: none; word-break: break-word; }
table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; font-size: 8pt; page-break-inside: auto; }
table.wide { font-size: 7.2pt; }
tr { page-break-inside: avoid; }
th { background: #0B5FD7; color: #fff; text-align: left; padding: 4px 5px; font-weight: 600; }
td { border-bottom: 1px solid #E4E7EC; padding: 3.5px 5px; vertical-align: top; }
tbody tr:nth-child(even) td { background: #F5F8FF; }
code { font-family: 'Noto Sans Mono', monospace; background: #EEF4FF; color: #1849A9; padding: 0 3px; border-radius: 3px; font-size: 0.92em; }
pre { background: #F2F4F7; border: 1px solid #D0D5DD; border-radius: 6px; padding: 8px; font-size: 7pt; line-height: 1.3; white-space: pre-wrap; word-break: break-word; font-family: 'Noto Sans Mono', monospace; page-break-inside: avoid; }
.pre { background: #F2F4F7; border: 1px solid #D0D5DD; border-radius: 6px; padding: 8px; font-size: 6.6pt; line-height: 1.32; page-break-inside: avoid; overflow: hidden; margin: 6px 0 10px; color: #1D2939; }
.pre .ml { white-space: nowrap; height: 1.32em; }
.pre i { font-style: normal; display: inline-block; width: 0.6em; text-align: center; }
blockquote { margin: 8px 0; padding: 6px 10px; background: #FFFAEB; border-left: 4px solid #F79009; border-radius: 4px; }
blockquote p { margin: 2px 0; }
ul, ol { margin: 3px 0 6px 0; padding-left: 18px; }
li { margin: 1.5px 0; }
hr { border: none; border-top: 1px solid #D0D5DD; margin: 12px 0; }
svg.ar { width: 1.15em; height: .7em; vertical-align: middle; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; margin: 0 1px; }
svg.ar.v { width: .6em; height: .9em; }
.ic { display: inline-block; width: 1.05em; height: 1.05em; border-radius: 50%; vertical-align: -0.18em; color: #fff; font-size: .8em; line-height: 1.05em; text-align: center; font-weight: 700; position: relative; }
.ic.ok { background: #12B76A; }
.ic.ok::after { content: ""; position: absolute; left: .36em; top: .17em; width: .25em; height: .48em; border: solid #fff; border-width: 0 .13em .13em 0; transform: rotate(45deg); }
.ic.no { background: #D92D20; }
.ic.warn { background: #F79009; border-radius: 3px; }
.dot { display: inline-block; width: .7em; height: .7em; border-radius: 50%; vertical-align: 0; margin: 0 1px; }
.dot.red { background: #D92D20; } .dot.orange { background: #F79009; } .dot.yellow { background: #EAAA08; }
.dot.green { background: #12B76A; } .dot.dark { background: #344054; }
.dot.hollow { border: 1.5px solid #344054; }
.dot.half { border: 1.5px solid #344054; background: linear-gradient(90deg, #344054 50%, transparent 50%); }
.cb { display: inline-block; width: .85em; height: .85em; border: 1.4px solid #344054; border-radius: 2px; vertical-align: -0.1em; }
.cb.on { background: #0B5FD7; border-color: #0B5FD7; }
.tag { display: inline-block; font-size: .78em; padding: 0 5px; border-radius: 8px; background: #E4E7EC; color: #344054; font-weight: 600; }
.tag.amber { background: #FEF0C7; color: #B54708; }
.cover, .toc { }
section.toc { padding-top: 2mm; }
.part { page-break-before: always; }
.cover { height: 260mm; display: flex; flex-direction: column; justify-content: center; padding: 0 10mm; background: linear-gradient(160deg, #0B5FD7 0%, #1849A9 100%); color: #fff; border-radius: 0; }
.cover .brand { font-size: 13pt; letter-spacing: 1px; opacity: .9; margin-bottom: 18mm; font-weight: 600; }
.cover .t { font-size: 27pt; font-weight: 700; line-height: 1.15; }
.cover .s { font-size: 12.5pt; margin-top: 6mm; opacity: .95; }
.cover .meta { margin-top: 22mm; font-size: 9.5pt; opacity: .9; line-height: 1.7; }
.cover .warn { margin-top: 14mm; background: rgba(255,255,255,.14); border-radius: 8px; padding: 10px 12px; font-size: 9pt; }
.toc h1 { margin-top: 0; }
.toc ol { list-style: none; padding-left: 0; }
.toc li.l1 { font-weight: 700; margin-top: 8px; color: #0B5FD7; }
.toc li.l2 { padding-left: 14px; font-size: 8.6pt; }
.toc a { color: inherit; }
.annex-banner { background: #EEF4FF; border: 1px solid #B2CCFF; color: #1849A9; padding: 6px 10px; border-radius: 6px; font-size: 8.5pt; margin-bottom: 10px; }
"""


def main():
    out_path, title, subtitle, *parts = sys.argv[1:]
    toc, bodies = [], []
    for idx, spec in enumerate(parts):
        path, label = spec.split(":", 1)
        with open(path, encoding="utf-8") as f:
            md = f.read()
        toc.append((0, label, f"part{idx}"))
        body = convert(md, f"p{idx}", toc)
        banner = f'<div class="annex-banner">{html.escape(label)}</div>' if idx else ""
        bodies.append(f'<section class="part" id="part{idx}">{banner}{body}</section>')

    toc_html = ['<section class="part toc"><h1>Contents</h1><ol>']
    for level, text, hid in toc:
        if level == 0:
            toc_html.append(f'<li class="l1"><a href="#{hid}">{html.escape(text)}</a></li>')
        elif level == 2:
            toc_html.append(f'<li class="l2"><a href="#{hid}">{text}</a></li>')
    toc_html.append("</ol></section>")

    cover = f"""<section class="cover">
      <div class="brand">MyDoctor24 · MYDR24</div>
      <div class="t">{html.escape(title)}</div>
      <div class="s">{html.escape(subtitle)}</div>
      <div class="meta">Version 3.0 — Draft for approval<br/>17 October 2026<br/>Market: India-first<br/>Contents: Master specification + Annexes A–D</div>
      <div class="warn">Clinical content (thresholds, triage rules, programmes, response times) is draft and must be approved by the MYDR24 Clinical Governance Committee and regulatory counsel before use with patients. Screens are generated only after explicit approval of this document.</div>
    </section>"""

    doc = f"""<!doctype html><html><head><meta charset="utf-8"><title>{html.escape(title)}</title><style>{CSS}</style></head>
<body>{cover}{''.join(toc_html)}{''.join(bodies)}</body></html>"""
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(doc)
    print("HTML written:", out_path)


if __name__ == "__main__":
    main()
