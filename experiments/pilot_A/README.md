# pilot_A

jsPsych experiment: how decision relevance and prior complexity beliefs shape
reactions to an expert's unexpected finding and their explanation of it.

## Design

### Current recruitment pilot: DataPipe 96

`pilot_config.js` selects Zorblax and Crelite, target **96 completions**.
The configured Google Drive DataPipe experiment ID is `2BQjHVs5Lp2V`.
A missing or malformed ID blocks live startup.
Enable DataPipe Condition assignment and set **32 conditions**.
Live startup requests `/api/condition/`, validates the result, and maps 0–31
in this fixed order: configured story order → Totality/Reversibility →
Topology/Variable_adding → simple/complex → relevant/irrelevant.
Do not reorder categories or change the number of conditions during collection.
96 consecutive requests allocate each cell three times, but dropouts, repeated
entries and real upload tests consume assignments, so completed counts may vary.
Control recruitment on the recruitment platform. DataPipe's submission limit
rejects further uploads; account for tests and participants already in progress.

Every trial records `study_version`, `recruitment_target`, `pilot_cell_id`,
`datapipe_condition` and `assignment_method=datapipe_sequential`.
Live URL overrides are blocked. Offline preview uses `?test=1&condition=0`
(0–31), never requests a server condition and never uploads data. Existing
vignette/complexity/relevance overrides remain available only in test mode.

### Full material library

**24 vignettes** (`vignettes/text.csv`) = 6 scenarios x 2 relevance types
x 2 revision types, fully crossed:

Each scenario has three images in `vis_aids/`, all keyed off the base name:

| Scenario | Diagram (1b) | Scene (1a) | Evidence (2) |
|---|---|---|---|
| Xenobiology in Threa-4 | `threa.jpg` | `threa_0.jpg` | `threa_1.jpg` |
| Pharmacology: Mivacin | `mivacin.jpg` | `mivacin_0.jpg` | `mivacin_1.jpg` |
| Crop Yield: Vorath | `vorath.jpg` | `vorath_0.jpg` | `vorath_1.jpg` |
| Construction Material: Crelite | `crelite.jpg` | `crelite_0.jpg` | `crelite_1.jpg` |
| Water Supply: Velan | `velan.jpg` | `velan_0.jpg` | `velan_1.jpg` |
| Collective Resource Allocation: Velori | `velori.jpg` | `velori_0.jpg` | `velori_1.jpg` |

Only the **diagram** is informational: it shows the proposed mechanism and
carries a caption. The `_0` and `_1` illustrations are decorative — they set
the scene and depict none of the information participants are questioned
about — so they render with empty `alt`, no caption, and a 280px height cap
(the sources are square, and would otherwise fill the viewport). Their paths
are derived from the diagram's by the `_0` / `_1` suffixes; all three files are
checked for existence at build time.

### Image sizes

The Current understanding card also shows `vis_aids/simple.png` or
`vis_aids/complex.png`, selected by the participant's complexity condition.
Both use the same responsive 320px maximum width. The illustration is included
in the shared briefing HTML, so it also appears during Q2 re-reading.

`vis_aids/*.jpg` are **generated** display-sized copies. The full-resolution
PNGs live in `vis_aids/originals/` (~35 MB, git-ignored); regenerate after
adding or replacing one:

```bash
python3 optimize_images.py
```

The originals were several times larger than the sizes they are displayed at,
which put ~6 MB of images in front of every participant. The generated JPEGs
are capped at 2x the CSS size each is shown at — 2160px wide for the diagram,
560px square for the decorative pair — which brings a participant's image load
to **160-310 KB** depending on scenario, excluding the separately loaded
complexity PNG.

- Relevance types (`Relev_typ`): Totality, Reversibility.
- Revision types (`Rev_typ`): Topology, Variable_adding.

All material factors are **between subjects**. The complete library contains
24 × 2 × 2 = **96 possible cells**. Current live recruitment uses the two-story
subset and DataPipe's sequential allocation across **32 active cells**, as
specified above. Only the three measurement points are within subjects.

## Procedure

Three measurement points, each ending in the same four perception ratings,
**one per screen**:

- **perceived complexity** of the system (`perceived_complexity_*`)
- **team trustworthiness** (`team_trustworthiness_*`)
- **team honesty** (`team_honesty_*`)
- **team competence** (`team_competence_*`)

Each block then closes with a single **required** open-ended screen
(`reasoning_pre` / `reasoning_anomaly` / `reasoning_post`) asking the
participant to explain the reasoning behind all four ratings they just gave.
It replaces the four optional per-question boxes, which were expected to go
mostly unanswered. It is always last in the block, so it can refer back to every rating
regardless of the order they were shown in, and it carries the block's final
button.

**Order randomisation**: the complexity question and the three-question team
block are shuffled against each other, and the three team questions are
shuffled within their block — 12 possible orders, drawn afresh at each of the
three measurement points. The realised order is recorded on every ratings trial
as `question_order` (pipe-separated) plus `measure` and `question_position`.

1. **Screen 1**, split across two reading views, each followed by its own
   comprehension checks:
   - **1a** (`screen1_framing_reading`) — scene illustration (`_0`), study
     design + relevance framing + complexity framing, ending with the "Current
     understanding" briefing card.
     -> gate Q2 (briefing) and Q3 (decision context).
   - **1b** (`screen1_proposal_reading`) — the pre-statement: the research
     team's original proposal, with the mechanism diagram.
     -> gate Q1 (proposed mechanism).

   Then ratings (`_pre`).
2. **Screen 2** — anomaly evidence alone, with its illustration (`_1`).
   Comprehension gate Q4 -> ratings (`_anomaly`).
3. **Screen 3** — the expert's post-hoc justification.
   Comprehension gate Q5 -> ratings (`_post`).
4. **Final relevance check** — after `reasoning_post`, before DataPipe saving.
   One required 1–7 rating selected by Category × Relev_typ from
   `vignettes/relevance_checks.csv`. Totality asks whether partial fulfillment
   could still achieve the goal (Not at all → Completely); Reversibility asks
   how difficult switching would be (Not at all difficult → Extremely difficult).
   No correctness feedback or retry loop. `task=relevance_check`, `phase=end`,
   and a numeric `totality_check` or `reversibility_check` column are exported,
   along with the actual prompt and scale endpoints. Higher Totality scores mean
   partial fulfillment can suffice; higher Reversibility scores mean switching
   is harder. These are different constructs/directions, not one pooled score.

**Fullscreen**: after the welcome screen, a `jsPsychFullscreen` trial puts the
window into fullscreen; leaving fullscreen later covers the study with an
overlay until the participant returns. Copy, cut, paste, drag and right-click
are blocked throughout, so the vignette cannot be lifted out of the study and
free-text answers cannot be pasted in. Fullscreen entry/re-entry is skipped under `?test=1`; the copy/paste event
handlers are still installed in test mode.

**Comprehension gate**: a wrong answer hides the options, highlights the source
passage the question came from, and holds the Continue button disabled for 5
seconds; the question is then re-asked, looping until correct. Attempt counts
and first-attempt accuracy are recorded per question. Every check is asked
directly after the view it is drawn from: Q2 and Q3 off Screen 1a, Q1 off
Screen 1b, Q4 off the anomaly, Q5 off the added explanation. Q2's
correct answer depends on the complexity arm and Q3's on the relevance arm;
Q1, Q4 and Q5 have a single correct answer per vignette row.

## Editing the vignettes

`index.html` reads its content from `vignettes.js`, which is **generated**.
After editing any of the three source CSVs, regenerate it:

```bash
python3 build_vignettes.py
```

The script validates as it goes and refuses to write on any problem (missing
`[Decision-RELEVANT]` / `[Complexity-Simple]` markers, a `Revision_text` cell
that is not 6 paragraphs, an answer that is not one of its options, a `Category`
with no visual aid, a missing image file, rows misaligned between the CSVs, a
Scenario x `Relev_typ` x `Rev_typ` cell that is missing or duplicated).

### CSV format

`relevance_checks.csv` — 12 rows keyed by `Category` and `Relev_typ`, shared
across revision types and relevant/irrelevant arms. Columns: `Prompt`,
`Scale_min`, `Scale_max`. The builder rejects missing/duplicate/extra keys and
empty fields. Edit these prompts here, not in `index.html` or `vignettes.js`.

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
`build_vignettes.py`, and dropping all three images into `vis_aids/originals/`
— the mechanism diagram at the mapped base name, plus the two decorative
illustrations at the same name with `_0` and `_1` suffixes (see
`DECORATIVE_AIDS`) — then running `optimize_images.py` and `build_vignettes.py`.

## Data

Every row carries `subject_id`, `condition`, `complexity`, `relevance`,
`vignette_index`, `vignette_category`, `relev_typ`, `rev_typ`.

Ratings are on rows with `task` = `pre_ratings` / `anomaly_ratings` /
`post_ratings`, in fields suffixed `_pre` / `_anomaly` / `_post`, one row per
question plus `measure`, `question_position` and `question_order`.

The open-ended reasoning sits on its own row per measurement point, `task` =
`pre_reasoning` / `anomaly_reasoning` / `post_reasoning`, with `measure` =
`reasoning` and the text in `reasoning_pre` / `reasoning_anomaly` /
`reasoning_post`. These rows carry `question_order` (so the order the ratings
were given in is recoverable) but no `question_position`.

Comprehension rows record `question`, `question_text`, `answer` (positional,
`opt0`...), `answer_text`, `correct_answer`, `correct_answer_text`, `correct`,
`attempt_number`, and `first_attempt_correct`.

Data is saved at the end to DataPipe experiment `2BQjHVs5Lp2V`, using the
shared ID in `pilot_config.js`. Test mode does not upload. Live Google Drive
delivery and dashboard settings require an actual end-to-end upload test;
there is currently no streaming or participant-facing upload retry flow.
