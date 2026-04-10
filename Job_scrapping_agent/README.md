# AI Job Hunter Agent

A fully automated, AI-powered system that parses your resume, scrapes the latest job postings from leading platforms (LinkedIn, Indeed, Naukri), filters by freshness (< 24 hrs), evaluates your resume against each job using AI (Groq + LLaMA3), and logs the prioritized results directly into Google Sheets.

## 🚀 Features

- **Resume Parsing:** Accurately extracts skills, experience, and metadata from PDF/DOCX using AI.
- **Multi-Platform Scraper:** Native Playwright integrations for LinkedIn, Indeed, and Naukri.
- **Anti-Bot Defenses:** Implements stealth browser fingerprinting, realistic delays, dynamic selectors, and fallback strategies.
- **Session Management:** Persists LinkedIn cookies across runs to bypass login walls.
- **Smart Filtering & Deduplication:** Removes duplicate jobs across platforms and drops jobs older than 24 hours.
- **AI Job Matching:** Generates a Match Score (0-100), missing skills list, resume improvement suggestions, and a custom tailored cover letter for each job.
- **Google Sheets Integration:** Appends scored jobs automatically to your tracker.

## 🛠️ Prerequisites

- Python 3.11+
- Google Chrome installed on your machine
- Google Cloud Platform (GCP) Account for Sheets API Service Account
- Groq API Key (Free)

## 📦 Installation

1. **Clone & Install Dependencies**
   ```bash
   git clone <repo-url>
   cd job-agent
   pip install -r requirements.txt
   playwright install chrome
   ```

2. **API Keys & Environment**
   - Copy the example config: `cp .env.example .env`
   - Get a free [Groq API Key](https://console.groq.com) and add it to `.env` (`GROQ_API_KEY=xxx`)
   - Add your target `GOOGLE_SHEETS_SPREADSHEET_ID` to `.env` (it's the long string in the sheet's URL).

3. **Google Sheets Setup**
   - Go to Google Cloud Console.
   - Enable the Google Sheets API & Google Drive API.
   - Create Service Account credentials (JSON format).
   - Save the downloaded JSON file as `credentials.json` in the project root.
   - **Crucial:** Share your target Google Sheet with the email address found inside `credentials.json` (grant "Editor" permissions).

## 🔑 Initial Setup: LinkedIn Login

LinkedIn aggressively blocks unauthenticated scraping. You must log in manually *once* to save your session.

1. Open a python shell or write a quick script:
   ```python
   from utils import cookie_manager
   cookie_manager.prompt_manual_login("linkedin", "https://www.linkedin.com/login")
   ```
2. A Chrome window will open. Login to your account manually.
3. Close the browser. Your session cookies are now saved to `sessions/linkedin_session.json` and will be reused automatically.

## 🏃‍♂️ Usage

Run the master script via CLI:

```bash
python main.py \
    --resume "path/to/resume.pdf" \
    --query "Python Developer" \
    --location "Hyderabad" \
    --platforms "indeed,naukri,linkedin"
```

The system will:
1. Parse your resume via Groq.
2. Spin up Playwright instances to scrape each platform.
3. Deduplicate and filter jobs.
4. Pass the filtered jobs to the AI matcher.
5. Push the final analyzed data to your Google Sheet.

## 🕰️ Scheduling with Cron

To automate daily searching, use a crontab entry (macOS/Linux):

```bash
# Run every 6 hours
0 */6 * * * cd /path/to/job-agent && /path/to/python main.py --resume ./resume.pdf --query "Data Scientist" --location "Remote" >> logs/job_agent.log 2>&1
```

## ⚠️ Troubleshooting

**LinkedIn CAPTCHA loop or "0 jobs":**
- LinkedIn session may have expired or triggered unusually high rate limiting. Delete `sessions/linkedin_session.json` and run the manual login process again. Let it rest for 24 hours if banned.

**Indeed / Naukri "0 jobs found":**
- Playwright might have updated its headless detection signatures. Ensure `playwright-stealth` is engaged. Try running with `config.HEADLESS = False` in `config.py` to watch what the browser sees.

**Google Sheets `SpreadsheetNotFound` error:**
- Ensure you actually clicked "Share" in the top right of your Google spreadsheet and shared it with the `xxx@yyy.iam.gserviceaccount.com` email from your `credentials.json`.
