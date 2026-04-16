# 🎯 HuntAI: The Strategic AI Job Hunter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Framework: FASTAPI](https://img.shields.io/badge/Framework-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)

**HuntAI** is an autonomous agent designed to automate the grueling process of job hunting. It doesn't just scrape; it **strategizes**. By combining a high-speed local matching engine with deep-tier AI analysis, HuntAI finds, ranks, and prepares your applications while you sleep.

---

## 🚀 Live Demo & Preview
> [!IMPORTANT]
> **View the Deployed App:** [[Click here](https://huntaipro.netlify.app)]

---

## ✨ Features

- **🛡️ Stealth Scraping**: Powered by `SeleniumBase` in UC (Undetected) mode to bypass bot detection on LinkedIn, Indeed, and Naukri.
- **🧠 Hybrid Intelligence**:
  - **Tier 1 (Local)**: Instant, zero-cost ranking using a weighted keyword engine.
  - **Tier 2 (AI)**: Deep-dive analysis and cover letter generation via **Groq (Llama 3)** for the best matches.
- **📶 Real-time Observability**: Watch the agent's thought process and logs in real-time via a high-fidelity SSE dashboard.
- **📊 Automated Exports**: One-click Excel generation containing all analyzed jobs and custom-tailored cover letters.
- **🔗 Proxy Ready**: Built-in support for rotating proxies to ensure 100% uptime on cloud deployments.

---

## 🛠️ Architecture

HuntAI is built for scalability and performance:
- **Frontend**: Next.js 14, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI (Python), MongoDB (Storage), Supabase (Auth).
- **Engine**: SeleniumBase (Scraping), Local TF-IDF (Matching), Groq (Reasoning).

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB instance (Atlas or Local)
- Groq API Key (Optional for basic ranking, required for coaching)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
sbase install chromedriver
```

**Configure `.env`:**
```env
# Essential
MONGODB_URI=your_mongo_uri
GROQ_API_KEY=your_groq_key

# Auth (Google OAuth)
GOOGLE_CLIENT_ID=your_client_id
JWT_SECRET_KEY=your_secret_key

# Email (For OTP verification)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Optional
PROXY_URL=http://user:pass@host:port
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🐳 Docker Deployment
For a one-click cloud deployment (Render/Railway/Docker):

```bash
docker build -t huntai-backend ./backend
docker run -p 8000:8000 huntai-backend
```

---

## 🤝 Contributing
Contributions are welcome! If you have ideas for new scrapers or better matching algorithms, feel free to open a Pull Request.

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Open a Pull Request

---

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.

---
**Crafted with ❤️ for the Developer Community.**
