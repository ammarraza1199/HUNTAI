# How to Successfully Run the AI Job Hunter Agent (v2.0)

This agent is now equipped with **Multi-Engine Technology** (Playwright, SeleniumBase, Nodriver) and **Stealth 2.0** to bypass bot detection.

---

### Phase 1: Installation
Open your terminal inside the `Job_scrapping_agent` folder and run:

```bash
# 1. Install regular dependencies
pip install -r requirements.txt

# 2. Install new stealth engines
pip install --user seleniumbase nodriver

# 3. Install browser binaries
playwright install chromium
```

---

### Phase 2: Configuration (.env & Keys)

1.  **AI Power**: Get a free key from [console.groq.com](https://console.groq.com) and add it to `GROQ_API_KEY` in `.env`.
2.  **Storage**: Follow the `credentials.json` setup guide to link your Google Sheet. **IMPORTANT**: Share your Google Sheet with the `client_email` found inside `credentials.json` as an "Editor".

---

### Phase 3: Stealth Setup (One-Time)
LinkedIn requires a session to show you the best jobs. Run this to log in once:
```bash
python -c "from utils.cookie_manager import prompt_manual_login; prompt_manual_login('linkedin', 'https://www.linkedin.com/login')"
```
*Login, see your feed, then close the browser window.*

---

### Phase 4: Running the Agent

You can now choose which "Engine" to use. If you get blocked on one, simply switch to another!

#### 🚀 Choice 1: SeleniumBase (Recommended for Free Use)
This engine uses "Undetected-Chromedriver" to bypass most blocks on LinkedIn and Naukri.
```bash
python main.py --resume resume.pdf --query "Python Developer" --location "Pune" --engine sb
```

#### 🚀 Choice 2: Playwright (Standard)
Uses the session you saved in Phase 3. Good for general scraping.
```bash
python main.py --resume resume.pdf --query "AI Engineer" --location "Bangalore" --engine playwright
```

#### 🚀 Choice 3: Nodriver (Experimental Pro)
The ultimate stealth choice for Naukri if all else fails.
```bash
python main.py --resume resume.pdf --query "MERN Stack" --location "Hyderabad" --engine nd
```

---

### 🔥 Pro Features

#### 1. Batch Search (The "Job Hunter" Mode)
Search for multiple roles across multiple cities in one go. The app will take "Coffee Breaks" (2-5 mins) between cities to stay undetected.
```bash
python main.py --resume resume.pdf --query "AI ML Engineer,Data Scientist,Fullstack" --location "Pune,Bangalore,Gurugram" --engine sb --remote
```

#### 2. Stealth 2.0 Protections (Built-in)
- **Session Warming**: Browser visits Google/Bing first to look human.
- **Hardware Spoofing**: Randomizes CPU/RAM signatures.
- **Mouse Jitter**: Simulates random human cursor movements.

---

### CLI Arguments Summary:
- `--resume`: Your resume file (PDF/DOCX).
- `--query`: Job title(s) to search (comma-separated).
- `--location`: City/location(s) to search (comma-separated).
- `--engine`: `playwright`, `sb` (SeleniumBase), or `nd` (Nodriver).
- `--remote`: Filter for remote-only jobs.
- `--platforms`: `indeed,naukri,linkedin` (comma-separated).
