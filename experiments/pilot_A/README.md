# pilot_A

jsPsych experiment: how decision relevance and prior complexity beliefs shape
reactions to an expert's unexpected finding and their explanation of it.

## Design

**18 vignettes** (`vignettes/text.csv`) = 6 scenarios x 3 relevance types:

| Scenario | Visual aid | Revision type |
|---|---|---|
| Xenobiology in Threa-4 | `vis_aids/threa.png` | Topology |
| Pharmacology: Mivacin | `vis_aids/mivacin.png` | Topology |
| Crop Yield: Vorath | `vis_aids/vorath.png` | Topology |
| Construction Material: Crelite | `vis_aids/crelite.png` | Variable_adding |
| Water Supply: Velan | `vis_aids/velan.png` | Variable_adding |
| Collective Resource Allocation: Velori | `vis_aids/velori.png` | Variable_adding |

Relevance types (`Relev_typ`): Totality, Reversibility, Directionality.

Vignette, **complexity** (simple / complex) and **relevance** (relevant /
irrelevant) are drawn independently and uniformly at random per participant:
18 x 2 x 2 = **72 cells**.

## Procedure

Three measurement points, each ending in the same three ratings (perceived
complexity, team competence, team honesty; each with an optional open-ended
justification):

1. **Screen 1** — study design + relevance framing + complexity framing +
   pre-statement (the expert's original proposal).
   Comprehension gate Q1-Q3 -> ratings (`_pre`) -> prediction task (2 open
   questions) -> manipulation check (revision likelihood %, 3 revision-reason
   Likerts).
2. **Screen 2** — anomaly evidence alone.
   Comprehension gate Q4 -> ratings (`_anomaly`).
3. **Screen 3** — the expert's post-hoc justification.
   Ratings (`_post`).

**Comprehension gate**: a wrong answer hides the options, highlights the source
passage the question came from, and holds the Continue button disabled for 5
seconds; the question is then re-asked, looping until correct. Attempt counts
and first-attempt accuracy are recorded per question.

## Editing the vignettes

`index.html` reads its content from `vignettes.js`, which is **generated**.
After editing either CSV, regenerate it:

```bash
python3 build_vignettes.py
```

The script validates as it goes and refuses to write on any problem (missing
`[Decision-RELEVANT]` / `[Complexity-Simple]` markers, a `Revision_text` cell
that is not 6 paragraphs, an answer that is not one of its options, a `Category`
with no visual aid, a missing image file, rows misaligned between the CSVs).

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
Q2 has per-complexity answers, Q3 per-relevance answers.

Paragraphs are plain text. Quoted speech (a paragraph opening with `"`) renders
italic; a lead-in line (ending with `:`) renders bold.

Adding a new scenario also means adding its `Category` to `VISUAL_AIDS` in
`build_vignettes.py`.

## Data

Every row carries `subject_id`, `condition`, `complexity`, `relevance`,
`vignette_index`, `vignette_category`, `relev_typ`, `rev_typ`.

Ratings are on rows with `task` = `pre_ratings` / `anomaly_ratings` /
`post_ratings`, in fields suffixed `_pre` / `_anomaly` / `_post`.

Comprehension rows record `question`, `question_text`, `answer` (positional,
`opt0`...), `answer_text`, `correct_answer`, `correct_answer_text`, `correct`,
`attempt_number`, and `first_attempt_correct`.

Data is saved to DataPipe experiment `uNrh6jZkRoPw`.
