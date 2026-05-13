# jsPsych Experiment Platform

A web-based experimental platform using jsPsych for creating psychology experiments with DataPipe for cloud data collection.

## Project Structure

```
.
├── .nojekyll                # Disables Jekyll processing on GitHub Pages
├── .gitignore              # Git ignore file
├── index.html              # Main landing page listing all experiments
├── README.md               # This file
└── experiments/            # Experiment folders
    ├── example-experiment/
    │   └── index.html      # Example experiment
    └── threa4-study/
        └── index.html      # Threa-4 research study
```

## Features

- **Frontend**: jsPsych framework with multiple plugins
  - html-keyboard-response
  - html-button-response
  - survey-html-form
  - instructions
  - survey-multi-choice
  - survey-likert
  - survey-text
- **Data Collection**: DataPipe cloud-based data storage
- **Deployment**: GitHub Pages compatible (static hosting)
- **No Backend Required**: All data saving handled by DataPipe

## Quick Start

### Option 1: Local Testing

Simply open any experiment's `index.html` file directly in your browser:
```bash
# Navigate to an experiment folder
cd experiments/threa4-study

# Open in browser (macOS)
open index.html

# Or use a simple HTTP server
python -m http.server 8000
# Then visit http://localhost:8000
```

### Option 2: Deploy to GitHub Pages

1. **Push this repository to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy experiments with DataPipe"
   git push origin main
   ```

2. **Configure GitHub Pages**:
   - Go to your repo Settings → Pages
   - Set Source to **"Deploy from a branch"**
   - Select branch: **main**
   - Select folder: **/ (root)**
   - Click Save

3. **Wait for deployment** (usually takes 1-2 minutes)

4. **Access your experiments**:
   - Main page: `https://[username].github.io/[repo-name]/`
   - Threa-4 study: `https://[username].github.io/[repo-name]/experiments/threa4-study/`
   - Example: `https://[username].github.io/[repo-name]/experiments/example-experiment/`

**Important**: The `.nojekyll` file in this repo disables Jekyll processing, allowing GitHub Pages to serve your files as-is.

All data will be automatically saved to DataPipe cloud storage!

## Creating a New Experiment

1. Create a new folder in the `experiments/` directory:
```bash
mkdir experiments/my-new-experiment
```

2. Create an `index.html` file using the template below

3. Update your experiment ID in the DataPipe configuration

### Basic Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Experiment</title>

  <!-- jsPsych core -->
  <script src="https://unpkg.com/jspsych@7.3.4"></script>
  <link href="https://unpkg.com/jspsych@7.3.4/css/jspsych.css" rel="stylesheet" />

  <!-- Add your required plugins -->
  <script src="https://unpkg.com/@jspsych/plugin-html-button-response@1.1.3"></script>

  <!-- DataPipe plugin -->
  <script src="https://unpkg.com/@jspsych-contrib/plugin-pipe"></script>
</head>
<body></body>

<script>
  const jsPsych = initJsPsych({
    on_finish: function() {
      document.body.innerHTML = '<h1>Thank you!</h1>';
    }
  });

  // Generate unique participant ID
  const subject_id = jsPsych.randomization.randomID(10);
  const filename = `${subject_id}.csv`;

  let timeline = [];

  // Add your trials here
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: '<p>Hello World!</p>',
    choices: ['Continue']
  });

  // Save data to DataPipe
  timeline.push({
    type: jsPsychPipe,
    action: "save",
    experiment_id: "YOUR_EXPERIMENT_ID",  // Replace with your DataPipe experiment ID
    filename: filename,
    data_string: () => jsPsych.data.get().csv()
  });

  jsPsych.run(timeline);
</script>
</html>
```

### Getting Your DataPipe Experiment ID

1. Go to [DataPipe](https://pipe.jspsych.org/)
2. Sign in and create a new experiment
3. Copy your experiment ID
4. Replace `YOUR_EXPERIMENT_ID` in the template above

## Available jsPsych Plugins

All experiments use plugins loaded from CDN (no installation needed):
- `@jspsych/plugin-html-keyboard-response` - Keyboard input trials
- `@jspsych/plugin-html-button-response` - Button click trials
- `@jspsych/plugin-survey-html-form` - Custom HTML forms
- `@jspsych/plugin-instructions` - Multi-page instructions
- `@jspsych/plugin-survey-multi-choice` - Multiple choice questions
- `@jspsych/plugin-survey-likert` - Likert scale questions
- `@jspsych/plugin-survey-text` - Open-ended text responses
- `@jspsych-contrib/plugin-pipe` - DataPipe integration

See [jsPsych documentation](https://www.jspsych.org/7.3/plugins/list-of-plugins/) for more plugins.

## Data Management

### Accessing Your Data

1. Log in to [DataPipe](https://pipe.jspsych.org/)
2. Navigate to your experiment
3. Download data as CSV files

### Data Format

Each participant's data is saved as a separate CSV file with:
- Unique participant ID
- All trial data with timestamps
- Response data for each trial
- Custom data fields you define

## Migrating from Old Server-Based Setup

If you were previously using the Node.js/Express server (`server.js`):

1. **No longer needed**: `server.js`, `package.json`, `node_modules/`
2. **Data migration**: Old data in `data/` folder can be kept for reference
3. **New data**: Will be stored in DataPipe cloud
4. **Deployment**: Switch from localhost to GitHub Pages

The experiments have been updated to use DataPipe instead of the local server.

## Troubleshooting

### Data not saving?

1. Check browser console for errors
2. Verify your DataPipe experiment ID is correct
3. Make sure you're connected to the internet
4. Check DataPipe service status

### CORS errors when testing locally?

- Use a local HTTP server instead of opening HTML files directly:
  ```bash
  python -m http.server 8000
  ```
- Or deploy to GitHub Pages (no CORS issues there)

### Need to test without internet?

- The DataPipe plugin requires internet connection
- For offline testing, you can temporarily comment out the save_data trial

## License

MIT
