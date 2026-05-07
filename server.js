const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from experiments directory
app.use('/experiments', express.static(path.join(__dirname, 'experiments')));

// Home page - list all available experiments
app.get('/', (req, res) => {
  const experimentsDir = path.join(__dirname, 'experiments');

  if (!fs.existsSync(experimentsDir)) {
    fs.mkdirSync(experimentsDir, { recursive: true });
  }

  const experiments = fs.readdirSync(experimentsDir)
    .filter(file => fs.statSync(path.join(experimentsDir, file)).isDirectory());

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Experiment List</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
        }
        h1 {
          color: #333;
        }
        .experiment-list {
          list-style: none;
          padding: 0;
        }
        .experiment-list li {
          margin: 10px 0;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 5px;
        }
        .experiment-list a {
          text-decoration: none;
          color: #0066cc;
          font-size: 18px;
        }
        .experiment-list a:hover {
          color: #004499;
        }
      </style>
    </head>
    <body>
      <h1>Available Experiments</h1>
      <ul class="experiment-list">
  `;

  if (experiments.length === 0) {
    html += '<li>No experiments available. Please create an experiment folder in the experiments directory.</li>';
  } else {
    experiments.forEach(exp => {
      html += `<li><a href="/experiments/${exp}/index.html">${exp}</a></li>`;
    });
  }

  html += `
      </ul>
    </body>
    </html>
  `;

  res.send(html);
});

// API endpoint to save experiment data
app.post('/save-data', (req, res) => {
  const { filename, data, experimentName } = req.body;

  if (!filename || !data) {
    return res.status(400).json({
      success: false,
      message: 'Missing filename or data'
    });
  }

  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create subdirectory for specific experiment if specified
  let savePath = dataDir;
  if (experimentName) {
    savePath = path.join(dataDir, experimentName);
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }
  }

  const filePath = path.join(savePath, filename);

  fs.writeFile(filePath, data, (err) => {
    if (err) {
      console.error('Error saving data:', err);
      return res.status(500).json({
        success: false,
        message: 'Error saving data',
        error: err.message
      });
    }

    console.log(`Data saved: ${filePath}`);
    res.json({
      success: true,
      message: 'Data saved successfully',
      path: filePath
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Experiments available at http://localhost:${PORT}/experiments`);
});
