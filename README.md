# A1 Diagnosis — Proactive Vision Risk Analysis Platform

**Live site:** [a1diagnosis.com](https://a1diagnosis.com)

A1 Diagnosis is the first blood-based AI platform for age-related macular degeneration (AMD) risk assessment. This repository contains the full production website — frontend and backend — serving clinical decision support information, interactive data visualizations, and investor materials.

## About

AMD is the leading cause of central vision loss in the United States, affecting 20 million Americans. A single blood plasma sample contains 10,000+ native peptide sequences across thousands of proteins. Our ML pipeline (14 algorithms evaluated, XGBoost selected) analyzes this molecular complexity to assess AMD risk *before vision loss occurs* — enabling early intervention for the 169 million Americans aged 35+ who could benefit.

AI-driven biomarker discovery results from this platform have been presented annually since 2021 at **ARVO** (Association for Research in Vision and Ophthalmology), the world's largest vision research conference.

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript, Chart.js, Plotly
- **Backend:** Netlify Functions, Netlify Blobs, SendGrid
- **Deployment:** GitHub + Netlify (CI/CD)
- **AI-Assisted Development:** Built with Claude AI and Claude Code under technical supervision

## Features

- Interactive biomarker comparison charts and disease progression models
- Comprehensive investor presentation with real-time data visualizations
- AMD education resources (stages, risk factors, early assessment)
- Analytics dashboard
- Responsive design across all devices
- Netlify serverless functions for backend logic

## Project Structure

```
├── index.html                  # Main landing page
├── presentation/               # Interactive investor presentation
├── js/                         # JavaScript modules
├── netlify/                    # Netlify serverless functions
├── pipeline.html               # ML pipeline overview
├── analytics-dashboard.html    # Analytics dashboard
├── what-is-amd.html            # AMD education
├── amd-stages.html             # AMD staging information
├── risk-factors.html           # Risk factor analysis
├── early-risk-assessment.html  # Early risk assessment
├── proactive-vision-platform.html  # Platform overview
└── netlify.toml                # Deployment configuration
```

## Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev
```

## Author

**Mustafa Ozgul, M.D.**
Founder & CEO, A1 Diagnosis
[LinkedIn](https://linkedin.com/in/drozgul)

## License

MIT
