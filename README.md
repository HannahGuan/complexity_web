# jsPsych Experiment Server

A web-based experimental platform using jsPsych for creating psychology experiments with an Express.js backend.

## Project Structure

```
.
├── server.js                 # Express server
├── package.json             # Node.js dependencies
├── experiments/             # Experiment folders
│   └── example-experiment/
│       └── index.html      # Example experiment
└── data/                   # Saved experimental data (auto-created)
    └── [experiment-name]/  # Data organized by experiment
```

## Features

- **Backend**: Express.js server with data saving API
- **Frontend**: jsPsych framework with multiple plugins
  - html-keyboard-response
  - html-button-response
  - survey-html-form
  - instructions
  - survey-multi-choice
- **Data Management**: Automatic data saving to CSV files
- **Development**: Hot reload with nodemon

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

### Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3000`

### Access Experiments

1. Open browser and navigate to `http://localhost:3000`
2. You'll see a list of all available experiments
3. Click on an experiment to start

### Create a New Experiment

1. Create a new folder in the `experiments/` directory:
```bash
mkdir experiments/my-new-experiment
```

2. Create an `index.html` file in your experiment folder

3. Use the example experiment as a template (see `experiments/example-experiment/index.html`)

4. Key components to include:
   - jsPsych initialization
   - Timeline array with your trials
   - Data saving function that POSTs to `/save-data`
   - Unique participant ID generation

### Data Saving

Experiments automatically save data to the server using the `/save-data` endpoint.

Example:
```javascript
function saveData() {
  const data = jsPsych.data.get().csv();
  const filename = participantId + '.csv';

  fetch('http://localhost:3000/save-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: filename,
      data: data,
      experimentName: 'your-experiment-name'
    })
  });
}
```

Data will be saved to: `data/[experimentName]/[filename].csv`

## jsPsych Plugins

The example experiment includes these plugins (via CDN):
- `@jspsych/plugin-html-keyboard-response` - For keyboard input trials
- `@jspsych/plugin-html-button-response` - For button click trials
- `@jspsych/plugin-survey-html-form` - For custom HTML forms
- `@jspsych/plugin-instructions` - For multi-page instructions
- `@jspsych/plugin-survey-multi-choice` - For multiple choice questions

## Server API

### GET `/`
Returns a list of all available experiments

### POST `/save-data`
Saves experimental data

Request body:
```json
{
  "filename": "participant_12345.csv",
  "data": "csv data string",
  "experimentName": "my-experiment"
}
```

Response:
```json
{
  "success": true,
  "message": "Data saved successfully",
  "path": "/path/to/saved/file"
}
```

## Development Notes

- The server uses CORS middleware to allow cross-origin requests
- Data directory is automatically created if it doesn't exist
- Each experiment can have its own subdirectory in the data folder
- Participant IDs should be unique (use timestamp + random number)

## Next Steps

To create your new experiment:
1. Copy the example experiment folder
2. Modify the trials in the timeline array
3. Update the instructions and stimuli
4. Test locally using `npm run dev`
5. Check saved data in the `data/` directory

## License

MIT
