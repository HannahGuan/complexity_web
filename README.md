# Complexity Prior — Web Experiments

Browser-based jsPsych studies of how prior beliefs about causal complexity and
practical decision requirements shape evaluations of simplified explanations
and later revisions. The current recruitment study is **Pilot A**.

## Current Pilot A

| Setting | Current implementation |
|---|---|
| Stories | Zorblax (Threa-4) and Crelite (Moran-2) |
| Relevance type | Totality / Reversibility |
| Revision type | Topology / Variable_adding |
| Complexity | Simple / Complex |
| Decision relevance | Relevant / Irrelevant |
| Assignment | DataPipe sequential condition IDs 0–31 |
| Recruitment target | 64 completed participants in the first recruitment batch |
| Participant-facing duration | 8–12 minutes |
| DataPipe experiment ID | `2BQjHVs5Lp2V` |

Each participant sees **one story in one condition**. All five material factors
are between subjects. Perceived complexity and team trustworthiness, honesty,
and competence are measured within subjects at three points: after the original
proposal, after the anomaly, and after the team's response. Each measurement
point ends with one required written justification. A required relevance check
appears at the end of the study, before saving.

There are **32 active cells**: 2 stories × 2 × 2 × 2 × 2. DataPipe cycles through
them; this is sequential allocation, not random assignment. Ninety-six
consecutive condition requests assign each cell three times. Dropouts, repeat
visits and live tests consume assignments, so this does not guarantee three
completed datasets per cell.

The underlying material library still contains **24 vignette rows across six
stories**, or 96 possible cells when crossed with complexity and relevance.
Only the two configured stories are used in live Pilot A.

## Preview locally without collecting data

From this repository's root:

```bash
python3 -m http.server 8000
```

Open:

[Preview Pilot A, condition 0](http://localhost:8000/experiments/pilot_A/?test=1&condition=0)

Use `condition=0` through `condition=31` to preview every active cell. Test mode
never requests a DataPipe condition or uploads a CSV. At completion it displays
the CSV that would have been submitted. Internet access is still required to
load jsPsych and its plugins from their CDNs.

For a specific library vignette, test mode also supports:

```text
http://localhost:8000/experiments/pilot_A/?test=1&vignette=12&complexity=complex&relevance=irrelevant
```

Live mode rejects condition overrides. **Opening the study without `test=1`
requests a real DataPipe assignment**, even on localhost. Use test links for
routine previews.

## DataPipe and Google Drive setup

Local prelaunch fixes add Prolific ID capture and confirmed-upload completion;
these must be deployed after existing active sessions have finished.
The Prolific completion URL is still required before resuming recruitment.

The client configuration is in
[`experiments/pilot_A/pilot_config.js`](experiments/pilot_A/pilot_config.js).
The same experiment ID is used for condition assignment and final CSV upload.

In the DataPipe dashboard for `2BQjHVs5Lp2V`:

1. Confirm the experiment uses the intended Google Drive destination.
2. Enable **Condition assignment** and set the number of conditions to **32**.
3. Allow CSV validation; the output includes the default `trial_type` field.
4. Enable **Accept new data** when ready to test uploads and recruit.
5. Base64 uploads are unnecessary: illustrations are displayed, not uploaded.

The configuration records a target of 96; it does not enforce a global browser
quota. Control recruitment through the recruitment platform. A DataPipe session
limit rejects later submissions, including those from participants already in
progress, and should not be treated as an exact recruitment quota. Account for
live upload tests when setting a limit.

Before recruitment, complete one live run and verify the actual CSV in the Drive
folder linked from DataPipe. Local preview checks do not establish that the
account is connected, accepting data, or delivering files. A live run consumes a
condition assignment and, if accepted, a submission.

Do not change the number of DataPipe conditions or reorder the configured stories
during collection: the condition-to-material mapping must remain stable.

Official references: [setup](https://pipe.jspsych.org/getting-started),
[condition assignment](https://pipe.jspsych.org/docs/experiments/conditions),
[validation and session limits](https://pipe.jspsych.org/docs/experiments/validation).

## Data and current saving behavior

Pilot A uses jsPsych 7.3.4 and `collection.js` for a verified final upload. It uploads one CSV,
named with a random participant ID, **at the end**. Incremental saving is not
implemented; closing the study before the save trial can lose the session.

Every trial carries the subject ID, story and factor levels, `study_version`,
`recruitment_target`, `pilot_cell_id`, `datapipe_condition`, and
`assignment_method`. The final check exports a numeric `totality_check` or
`reversibility_check` field. See the [Pilot A README](experiments/pilot_A/README.md)
for detailed trial and response fields.

Startup stops if condition assignment fails or returns an invalid number.
The completion handler accepts DataPipe HTTP 201 (stored) or 202 (queued),
then offers the configured Prolific completion link. A rejected/network-failed
submission shows retry and CSV backup download controls, retaining a local
backup where browser storage is available. Retrying uses the same filename
and payload. A duplicate-file response is not silently treated as success.
This backup is not an interrupted-study resume feature.

Prolific entry links must include `PROLIFIC_PID`, `STUDY_ID`, and `SESSION_ID`.
All three are exported. Set `prolific_completion_url` in `pilot_config.js` to
the normal completion URL from the Prolific dashboard. Panel entry is blocked
before condition assignment if that URL or its identifiers are missing/invalid.
Plain researcher entry without panel parameters remains available for live QA.

Checks:

```bash
node experiments/pilot_A/tests/startup.test.js
node experiments/pilot_A/tests/collection.test.js
```

The prelaunch QA file `QA_ONLY_prelaunch_20261028_fullflow.csv` was confirmed
present in Google Drive by the researcher; exclude it from participant analysis.

## Editing content

| File | Purpose |
|---|---|
| `experiments/pilot_A/index.html` | Procedure, presentation, ratings and saving |
| `experiments/pilot_A/pilot_config.js` | Stories, version, target, DataPipe ID, condition count and Prolific completion URL |
| `experiments/pilot_A/collection.js` | Verified upload, retry, backup and completion handling |
| `experiments/pilot_A/vignettes/text.csv` | Story and manipulation text |
| `experiments/pilot_A/vignettes/comprehension.csv` | Comprehension questions and answer keys |
| `experiments/pilot_A/vignettes/relevance_checks.csv` | Story-specific Totality and shared Reversibility checks |
| `experiments/pilot_A/build_vignettes.py` | Validates CSVs and generates the browser material library |
| `experiments/pilot_A/vignettes.js` | Generated content; do not edit manually |
| `experiments/pilot_A/vis_aids/` | Scenario illustrations and `simple.png` / `complex.png` |

After editing any source CSV:

```bash
cd experiments/pilot_A
python3 build_vignettes.py
```

The Current understanding card selects `simple.png` or `complex.png` from the
participant's assigned complexity condition. Images share a responsive 320px
maximum width and appear again in the Q2 re-reading passage.

See the [Pilot A README](experiments/pilot_A/README.md) for the complete material
schema, image generation workflow and comprehension retry behavior. Update the
study version when changing materials or the design during piloting.

## Hosting and repository layout

```text
index.html                    Static study landing page
experiments/pilot_A/           Current pilot and its materials
experiments/                   Other study versions and examples
server.js                     Optional Express server and legacy local-save route
package.json                  Commands/dependencies for the optional server
.nojekyll                     Static hosting support for GitHub Pages
```

Pilot A can be hosted as static files, including on GitHub Pages. It does not
use the legacy `/save-data` route in `server.js`; DataPipe handles its upload.
The optional Node server can also serve the experiments locally via `npm start`.

For deployment, include `index.html`, `pilot_config.js`, `collection.js`, regenerated
`vignettes.js`, and all referenced visual assets in `experiments/pilot_A/`.
Use `/experiments/pilot_A/` as the live study path, without test parameters.
Local edits do not publish themselves: confirm the configured hosting deployment
has completed, then check the hosted study and one real upload before recruiting.
