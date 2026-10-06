#!/usr/bin/env python3
"""Compile vignettes/text.csv + vignettes/comprehension.csv into vignettes.js.

The experiment (index.html) reads window.VIGNETTES from the generated file, so
re-run this script after editing either CSV:

    python3 build_vignettes.py

Emitting a .js file rather than .json keeps the experiment runnable straight
from the filesystem (fetch() of a local .json is blocked by the file:// origin).
"""

import csv
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TEXT_CSV = os.path.join(HERE, "vignettes", "text.csv")
COMP_CSV = os.path.join(HERE, "vignettes", "comprehension.csv")
OUT_JS = os.path.join(HERE, "vignettes.js")

# Visual aid per scenario. Kept explicit so a new Category fails loudly here
# rather than silently rendering a broken image in the experiment.
VISUAL_AIDS = {
    "Xenobiology in Threa-4": "vis_aids/threa.png",
    "Pharmacology: Mivacin": "vis_aids/mivacin.png",
    "Crop Yield: Vorath": "vis_aids/vorath.png",
    "Construction Material: Crelite": "vis_aids/crelite.png",
    "Water Supply: Velan": "vis_aids/velan.png",
    "Collective Resource Allocation: Velori": "vis_aids/velori.png",
}

errors = []


def fail(msg):
    errors.append(msg)


def paragraphs(text):
    """Split a cell into non-empty, whitespace-stripped paragraphs."""
    return [p.strip() for p in text.replace("\r\n", "\n").split("\n") if p.strip()]


def split_on_tags(text, tags, label, idx):
    """Split a cell into the lead-in prose plus one chunk per [Tag] marker.

    Returns (intro_paragraphs, {tag: paragraphs}).
    """
    positions = []
    for tag in tags:
        marker = "[%s]" % tag
        at = text.find(marker)
        if at == -1:
            fail("row %s: %s is missing the %s marker" % (idx, label, marker))
            return [], {}
        if text.count(marker) > 1:
            fail("row %s: %s has %d copies of %s" % (idx, label, text.count(marker), marker))
            return [], {}
        positions.append((at, tag, len(marker)))
    positions.sort()
    if [t for _, t, _ in positions] != list(tags):
        fail("row %s: %s markers are out of order (%s)"
             % (idx, label, ", ".join(t for _, t, _ in positions)))
        return [], {}

    intro = paragraphs(text[: positions[0][0]])
    chunks = {}
    for i, (at, tag, mlen) in enumerate(positions):
        end = positions[i + 1][0] if i + 1 < len(positions) else len(text)
        chunks[tag] = paragraphs(text[at + mlen : end])
        if not chunks[tag]:
            fail("row %s: %s has no text after [%s]" % (idx, label, tag))
    return intro, chunks


def split_briefing_heading(paras, idx):
    """Peel the trailing "<domain> current understanding:" clause off the intro.

    Every Complexity_text cell ends its lead-in with a short clause that the
    experiment renders as the briefing card's heading; the prose before it sits
    outside the card. Returns (background_paragraphs, heading).
    """
    if not paras:
        fail("row %s: Complexity_text has no lead-in prose" % idx)
        return [], ""
    last = paras[-1]
    if not last.endswith(":"):
        fail("row %s: Complexity_text lead-in does not end with a heading clause "
             "(expected it to end with ':', got %r)" % (idx, last[-40:]))
        return paras, ""
    cut = last.rfind(". ")
    if cut == -1:
        return paras[:-1], last.rstrip(":").strip()
    return paras[:-1] + [last[: cut + 1].strip()], last[cut + 2 :].rstrip(":").strip()


def drop_header(paras, idx, label):
    """Drop a leading section header (a short line with no sentence punctuation)."""
    if paras and len(paras[0]) < 60 and not paras[0].rstrip().endswith((".", "!", "?", ":")):
        return paras[1:]
    return paras


def options(cell, idx, label):
    opts = [o.strip() for o in cell.split("|") if o.strip()]
    if len(opts) < 2:
        fail("row %s: %s needs at least 2 options, got %r" % (idx, label, cell))
    if len(set(opts)) != len(opts):
        fail("row %s: %s has duplicate options" % (idx, label))
    return opts


def answer(cell, opts, idx, label):
    a = cell.strip()
    if a not in opts:
        fail("row %s: %s answer %r is not one of the options %r" % (idx, label, a, opts))
    return a


def read_rows(path):
    with open(path, newline="", encoding="utf-8-sig") as fh:
        rows = list(csv.DictReader(fh))
    for r in rows:
        for k in ("Index", "Category", "Relev_typ", "Rev_typ"):
            r[k] = (r[k] or "").strip()
    return rows


def main():
    text_rows = read_rows(TEXT_CSV)
    comp_rows = read_rows(COMP_CSV)

    if len(text_rows) != len(comp_rows):
        print("ERROR: text.csv has %d rows, comprehension.csv has %d"
              % (len(text_rows), len(comp_rows)), file=sys.stderr)
        return 1

    vignettes = []
    for t, c in zip(text_rows, comp_rows):
        idx = t["Index"]
        for field in ("Index", "Category", "Relev_typ", "Rev_typ"):
            if t[field] != c[field]:
                fail("row %s: %s differs between the CSVs (%r vs %r)"
                     % (idx, field, t[field], c[field]))

        category = t["Category"]
        if category not in VISUAL_AIDS:
            fail("row %s: category %r has no entry in VISUAL_AIDS" % (idx, category))
            visual_aid = ""
        else:
            visual_aid = VISUAL_AIDS[category]
            if not os.path.exists(os.path.join(HERE, visual_aid)):
                fail("row %s: visual aid %s does not exist" % (idx, visual_aid))

        # --- relevance framing: intro prose + the two decision-context variants
        rel_intro, rel_chunks = split_on_tags(
            t["Relevance_text"], ("Decision-RELEVANT", "Decision-IRRELEVANT"),
            "Relevance_text", idx)
        rel_intro = drop_header(rel_intro, idx, "Relevance_text")

        # --- complexity framing: intro prose + the two briefing variants
        cx_intro, cx_chunks = split_on_tags(
            t["Complexity_text"], ("Complexity-Simple", "Complexity-Complex"),
            "Complexity_text", idx)
        cx_background, briefing_heading = split_briefing_heading(cx_intro, idx)

        # --- revision text: proposal (3 paras), anomaly (1), justification (2)
        rev = paragraphs(t["Revision_text"])
        if len(rev) != 6:
            fail("row %s: Revision_text has %d paragraphs, expected 6 "
                 "(proposal x3, anomaly x1, justification x2)" % (idx, len(rev)))
            proposal, anomaly, justification = rev, [], []
        else:
            proposal, anomaly, justification = rev[0:3], rev[3:4], rev[4:6]

        q1_opts = options(c["Q1_options"], idx, "Q1")
        q2_opts = options(c["Q2_options"], idx, "Q2")
        q3_opts = options(c["Q3_options"], idx, "Q3")
        q4_opts = options(c["Q4_options"], idx, "Q4")
        q5_opts = options(c["Q5_options"], idx, "Q5")

        vignettes.append({
            "index": int(idx),
            "category": category,
            "relev_typ": t["Relev_typ"],
            "rev_typ": t["Rev_typ"],
            "visual_aid": visual_aid,
            "study_intro": rel_intro,
            "decision": {
                "relevant": rel_chunks.get("Decision-RELEVANT", []),
                "irrelevant": rel_chunks.get("Decision-IRRELEVANT", []),
            },
            "background": cx_background,
            "briefing_heading": briefing_heading,
            "complexity": {
                "simple": cx_chunks.get("Complexity-Simple", []),
                "complex": cx_chunks.get("Complexity-Complex", []),
            },
            "proposal": proposal,
            "anomaly": anomaly,
            "justification": justification,
            "comprehension": {
                "q1": {
                    "prompt": c["Q1_screen1"].strip(),
                    "options": q1_opts,
                    "answer": answer(c["Q1_answer"], q1_opts, idx, "Q1"),
                },
                "q2": {
                    "prompt": c["Q2_screen1"].strip(),
                    "options": q2_opts,
                    "answer_simple": answer(c["Q2_answer_Simple"], q2_opts, idx, "Q2 simple"),
                    "answer_complex": answer(c["Q2_answer_Complex"], q2_opts, idx, "Q2 complex"),
                },
                "q3": {
                    "prompt": c["Q3_screen1"].strip(),
                    "options": q3_opts,
                    "answer_relevant": answer(c["Q3_answer_Relevant"], q3_opts, idx, "Q3 relevant"),
                    "answer_irrelevant": answer(c["Q3_answer_Irrelevant"], q3_opts, idx, "Q3 irrelevant"),
                },
                "q4": {
                    "prompt": c["Q4_screen2"].strip(),
                    "options": q4_opts,
                    "answer": answer(c["Q4_answer"], q4_opts, idx, "Q4"),
                },
                # Asked on Screen 3, after the research team's justification.
                # The correct answer is baked into the row because Rev_typ is
                # now between-subject, so it needs no condition branch.
                "q5": {
                    "prompt": c["Q5_screen3"].strip(),
                    "options": q5_opts,
                    "answer": answer(c["Q5_answer"], q5_opts, idx, "Q5"),
                },
            },
        })

    for v in vignettes:
        for label in ("study_intro", "proposal", "anomaly", "justification",
                      "background", "briefing_heading"):
            if not v[label]:
                fail("row %s: %s is empty" % (v["index"], label))
        for q in ("q1", "q2", "q3", "q4", "q5"):
            if not v["comprehension"][q]["prompt"]:
                fail("row %s: %s prompt is empty" % (v["index"], q))

    # Category x Relev_typ x Rev_typ is meant to be fully crossed, with
    # Rev_typ manipulated between subjects by which row is drawn. A missing or
    # duplicated cell would silently bias the assignment, so check it here.
    cells = {}
    for v in vignettes:
        cells.setdefault((v["category"], v["relev_typ"], v["rev_typ"]), []).append(v["index"])
    categories = sorted({v["category"] for v in vignettes})
    relev_typs = sorted({v["relev_typ"] for v in vignettes})
    rev_typs = sorted({v["rev_typ"] for v in vignettes})
    for cat in categories:
        for rl in relev_typs:
            for rv in rev_typs:
                got = cells.get((cat, rl, rv), [])
                if len(got) != 1:
                    fail("cell (%s, %s, %s) appears %d times (expected 1): rows %s"
                         % (cat, rl, rv, len(got), got))
    expected = len(categories) * len(relev_typs) * len(rev_typs)
    if len(vignettes) != expected:
        fail("%d vignettes but %d categories x %d relevance types x %d revision "
             "types = %d" % (len(vignettes), len(categories), len(relev_typs),
                             len(rev_typs), expected))

    if errors:
        print("Refusing to write %s -- %d problem(s) found:" % (OUT_JS, len(errors)),
              file=sys.stderr)
        for e in errors:
            print("  - " + e, file=sys.stderr)
        return 1

    body = json.dumps(vignettes, indent=2, ensure_ascii=False)
    with open(OUT_JS, "w", encoding="utf-8") as fh:
        fh.write("// GENERATED FILE -- do not edit by hand.\n")
        fh.write("// Built from vignettes/text.csv + vignettes/comprehension.csv by\n")
        fh.write("// build_vignettes.py. Re-run that script after editing either CSV.\n")
        fh.write("window.VIGNETTES = %s;\n" % body)

    print("Wrote %s" % OUT_JS)
    print("  %d vignettes: %d categories x %d relevance types (%s) "
          "x %d revision types (%s)"
          % (len(vignettes), len(categories), len(relev_typs),
             "/".join(relev_typs), len(rev_typs), "/".join(rev_typs)))
    print("  x complexity (simple/complex) x relevance (relevant/irrelevant) "
          "= %d cells" % (len(vignettes) * 4))
    return 0


if __name__ == "__main__":
    sys.exit(main())
