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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Research Studies | Stanford Psychology</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          min-height: 100vh;
          background: linear-gradient(135deg, #8C1515 0%, #B83A4B 50%, #E04F39 100%);
          color: #fff;
          padding: 0;
          margin: 0;
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 60px 20px;
        }

        header {
          text-align: center;
          margin-bottom: 60px;
          animation: fadeInDown 0.8s ease-out;
        }

        .logo {
          font-size: 28px;
          font-weight: 300;
          letter-spacing: 2px;
          margin-bottom: 20px;
          text-transform: uppercase;
          opacity: 0.95;
        }

        h1 {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 20px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .subtitle {
          font-size: 20px;
          font-weight: 300;
          opacity: 0.9;
          margin-bottom: 10px;
        }

        .experiment-grid {
          display: grid;
          gap: 24px;
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        .experiment-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 32px;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .experiment-card:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-4px);
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .experiment-card a {
          text-decoration: none;
          color: #fff;
          display: block;
        }

        .experiment-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .experiment-title::before {
          content: '→';
          font-size: 28px;
          transition: transform 0.3s ease;
        }

        .experiment-card:hover .experiment-title::before {
          transform: translateX(8px);
        }

        .experiment-description {
          font-size: 16px;
          opacity: 0.9;
          line-height: 1.6;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 2px dashed rgba(255, 255, 255, 0.3);
        }

        .empty-state p {
          font-size: 18px;
          opacity: 0.8;
        }

        footer {
          text-align: center;
          margin-top: 60px;
          padding-top: 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          opacity: 0.7;
          font-size: 14px;
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 36px;
          }
          .logo {
            font-size: 20px;
          }
          .experiment-card {
            padding: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <div class="logo">Stanford Psychology</div>
          <h1>Research Studies</h1>
          <p class="subtitle">Participate in cutting-edge psychological research</p>
        </header>

        <div class="experiment-grid">
  `;

  if (experiments.length === 0) {
    html += `
          <div class="empty-state">
            <p>No experiments available at this time.</p>
            <p style="margin-top: 10px; font-size: 14px;">Please check back soon for new studies.</p>
          </div>
    `;
  } else {
    experiments.forEach(exp => {
      // Format experiment name: remove hyphens and capitalize words
      const displayName = exp
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      html += `
          <div class="experiment-card">
            <a href="/experiments/${exp}/index.html">
              <div class="experiment-title">${displayName}</div>
              <div class="experiment-description">Click to participate in this research study</div>
            </a>
          </div>
      `;
    });
  }

  html += `
        </div>

        <footer>
          <p>Questions? Contact your research coordinator</p>
        </footer>
      </div>
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
