# How to Run This Application

This guide will help you set up and run the **HuntAI** (AI Job Hunter Agent) application locally. The project is split into a **Next.js Frontend** and a **FastAPI Backend**.

## Prerequisites
Ensure you have the following installed:
- **Python 3.10+**
- **Node.js 18+** (with `npm` or `yarn`)
- **Supabase Account** (for Auth and Database)
- **Groq API Key** (for AI parsing and matching)

---

## 1. Backend Setup (FastAPI)

Follow these steps to get the backend API running:

### Step 1: Navigate to Backend
```bash
cd backend
```

### Step 2: Set Up Environment Variables
Create a `.env` file from the example:
```bash
cp .env.example .env
```
Open `.env` and fill in:
- `GROQ_API_KEY`: Your Groq API key.
- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_JWT_SECRET`: Your Supabase JWT secret (found in Settings -> API).
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key.

### Step 3: Install Python Dependencies
It is recommended to use a virtual environment:
```bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
```
Then install the required packages:
```bash
pip install -r requirements.txt
```

### Step 4: Install Browser Dependencies
The scraper uses `playwright`. Run this to install the required browser binaries:
```bash
playwright install chromium
```

### Step 5: Run the Backend
```bash
python main.py
```
The backend will start at `http://localhost:8000`. You can view the API documentation at `http://localhost:8000/docs`.

---

## 2. Frontend Setup (Next.js)

Follow these steps to get the frontend dashboard running:

### Step 1: Navigate to Frontend
```bash
cd frontend
```

### Step 2: Set Up Environment Variables
Create a `.env.local` file:
```bash
# Copy settings from the backend or your Supabase dashboard
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Step 3: Install Node Dependencies
```bash
npm install
```

### Step 4: Run the Frontend
```bash
npm run dev
```
The frontend will start at `http://localhost:3000`.

---

## 3. Database Setup (Supabase)

If you are setting up a fresh Supabase instance, ensure you have:
1. **Authentication** enabled (Email/Password).
2. **Database Tables**:
   - `users` (usually managed by Supabase Auth).
   - `runs` (id, user_id, query, location, status, total_jobs, etc.).
   - `jobs` (id, run_id, title, company, match_score, url, etc.).
3. **Storage**: Create a bucket named `resumes` for storing uploaded PDF/DOCX files.

---

## Summary of URLs
- **Frontend Dashboard**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **API Swagger Docs**: `http://localhost:8000/docs`
