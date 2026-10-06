# pilot_A

jsPsych experiment: how decision relevance and prior complexity beliefs shape
reactions to an expert's unexpected finding and their explanation of it.

## Design

**24 vignettes** (`vignettes/text.csv`) = 6 scenarios x 2 relevance types
x 2 revision types, fully crossed:

| Scenario | Visual aid |
|---|---|
| Xenobiology in Threa-4 | `vis_aids/threa.png` |
| Pharmacology: Mivacin | `vis_aids/mivacin.png` |
| Crop Yield: Vorath | `vis_aids/vorath.png` |
| Construction Material: Crelite | `vis_aids/crelite.png` |
| Water Supply: Velan | `vis_aids/velan.png` |
| Collective Resource Allocation: Velori | `vis_aids/velori.png` |

- Relevance types (`Relev_typ`): Totality, Reversibility.
- Revision types (`Rev_typ`): Topology, Variable_adding.

Both are **between subjects**: they ride along on whichever vignette row is
drawn. Because Scenario x Relev_typ x Rev_typ is fully crossed (and
`build_vignettes.py` refuses to build if it isn't), a uniform draw over the 24
rows leaves both balanced.

Vignette, **complexity** (simple / complex) and **relevance** (relevant /
irrelevant) are drawn independently and uniformly at random per participant:
24 x 2 x 2 = **96 cells**.

## Procedure

Three measurement points, each ending in the same four perception ratings,
**one per screen**, each with an optional open-ended justification:

- **perceived complexity** of the system (`perceived_complexity_*`)
- **team trustworthiness** (`team_trustworthiness_*`)
- **team honesty** (`team_honesty_*`)
- **team competence** (`team_competence_*`)

**Order randomisation**: the complexity question and the three-question team
block are shuffled against each other, and the three team questions are
shuffled within their block — 12 possible orders, drawn afresh at each of the
three measurement points. The realised order is recorded on every ratings trial
as `question_order` (pipe-separated) plus `measure` and `question_position`.

1. **Screen 1** — study design + relevance framing + complexity framing +
   pre-statement (the expert's original proposal).
   Comprehension gate Q1-Q3 -> ratings (`_pre`).
2. **Screen 2** — anomaly evidence alone.
   Comprehension gate Q4 -> ratings (`_anomaly`).
3. **Screen 3** — the expert's post-hoc justification.
   Comprehension gate Q5 -> ratings (`_post`).

**Fullscreen**: after the welcome screen, a `jsPsychFullscreen` trial puts the
window into fullscreen; leaving fullscreen later covers the study with an
overlay until the participant returns. Copy, cut, paste, drag and right-click
are blocked throughout, so the vignette cannot be lifted out of the study and
free-text answers cannot be pasted in. Both are off under `?test=1`.

**Comprehension gate**: a wrong answer hides the options, highlights the source
passage the question came from, and holds the Continue button disabled for 5
seconds; the question is then re-asked, looping until correct. Attempt counts
and first-attempt accuracy are recorded per question. Q1-Q3 come off Screen 1,
Q4 off the anomaly, and Q5 off the research team's added explanation. Q2's
correct answer depends on the complexity arm and Q3's on the relevance arm;
Q1, Q4 and Q5 have a single correct answer per vignette row.

## Editing the vignettes

`index.html` reads its content from `vignettes.js`, which is **generated**.
After editing either CSV, regenerate it:

```bash
python3 build_vignettes.py
```

The script validates as it goes and refuses to write on any problem (missing
`[Decision-RELEVANT]` / `[Complexity-Simple]` markers, a `Revision_text` cell
that is not 6 paragraphs, an answer that is not one of its options, a `Category`
with no visual aid, a missing image file, rows misaligned between the CSVs, a
Scenario x `Relev_typ` x `Rev_typ` cell that is missing or duplicated).

### CSV format

`text.csv` — one row per vignette, keyed on `Index`:

- `Relevance_text`: a header line, the study intro, then
  `[Decision-RELEVANT] ...` and `[Decision-IRRELEVANT] ...`
- `Complexity_text`: background prose ending in a
  "`<domain>` current understanding:" clause (rendered as the briefing card
  heading), then `[Complexity-Simple] ...` and `[Complexity-Complex] ...`
- `Revision_text`: exactly 6 paragraphs — proposal (3), anomaly (1),
  justification (2)

`comprehension.csv` — same `Index`, one row per vignette. Options are
`|`-delimited; each answer column must contain text matching one option exactly.
Q2 has per-complexity answers (`Q2_answer_Simple` / `Q2_answer_Complex`) and Q3
per-relevance answers (`Q3_answer_Relevant` / `Q3_answer_Irrelevant`); Q1, Q4
and `Q5_screen3` (asked after the added explanation) have one `*_answer` each.
The `_screenN` suffix names the reading screen the question is drawn from.

Paragraphs are plain text and all render in the same face and weight —
quotation marks alone mark who is speaking. Italic quotes and bold lead-ins
were removed because pilot readers skipped them.

Adding a new scenario also means adding its `Category` to `VISUAL_AIDS` in
`build_vignettes.py`.

## Data

Every row carries `subject_id`, `condition`, `complexity`, `relevance`,
`vignette_index`, `vignette_category`, `relev_typ`, `rev_typ`.

Ratings are on rows with `task` = `pre_ratings` / `anomaly_ratings` /
`post_ratings`, in fields suffixed `_pre` / `_anomaly` / `_post`, one row per
question plus `measure`, `question_position` and `question_order`.

Comprehension rows record `question`, `question_text`, `answer` (positional,
`opt0`...), `answer_text`, `correct_answer`, `correct_answer_text`, `correct`,
`attempt_number`, and `first_attempt_correct`.

Data is saved to DataPipe experiment `uNrh6jZkRoPw`.
