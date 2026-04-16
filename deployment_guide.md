# 🚀 HuntAI: Professional Deployment Guide

Follow this guide to move HuntAI from your local machine to a production environment on **Vercel** and **Render**.

---

## 🔐 1. Google OAuth Configuration
Since your frontend URL will change from `localhost` to Vercel, you **must** update your Google Cloud Console.

1.  Go to [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials).
2.  Edit your **OAuth 2.0 Client ID**.
3.  **Authorized JavaScript Origins**:
    *   `http://localhost:3000` (Keep this for testing)
    *   `https://your-app-name.vercel.app` (Add your new Vercel URL)
4.  **Authorized Redirect URIs**:
    *   `https://your-app-name.vercel.app/onboarding`
    *   `https://your-app-name.vercel.app/api/auth/callback/google`

---

## 🧬 2. Backend Deployment (Render)
Render is used for the Python API because it supports **Docker**, which we need for Selenium/Chrome.

### Step-by-Step:
1.  **Database**: Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2.  **GitHub**: Push your code to a GitHub repository.
3.  **Render Setup**:
    *   Login to Render and click **New > Web Service**.
    *   Connect your repository.
    *   **Runtime**: Select `Docker`.
    *   **Docker Command**: Should automatically use the `CMD` in our Dockerfile.
4.  **Environment Variables**: Add these in the Render "Env" tab:
    *   `MONGODB_URI`: Your Atlas connection string.
    *   `GROQ_API_KEY`: Your master key (or leave empty if users provide theirs).
    *   `JWT_SECRET_KEY`: A random long string.
    *   `APP_ENV`: `production`

---

## 🎨 3. Frontend Deployment (Vercel)
Vercel is the best home for your Next.js application.

### Step-by-Step:
1.  Click **New Project** on Vercel.
2.  Select your GitHub repo.
3.  **Root Directory**: Set to `frontend`.
4.  **Project Settings**:
    *   **Framework Preset**: `Next.js`.
5.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_BASE_URL`: The URL provided by Render (e.g., `https://huntai-backend.onrender.com`).
    *   `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your personal Google Client ID.

---

## ☕ 4. Keeping the Server "Hot" (Anti-Sleep)
Render’s free tier goes to sleep after 15 minutes of inactivity. Here is how to keep it awake 24/7 for free:

1.  Go to [Cron-job.org](https://cron-job.org/en/).
2.  Create a **New Cronjob**.
3.  **URL**: `https://your-backend.onrender.com/health`
4.  **Schedule**: Every 14 minutes.
5.  **Execution**: This sends a tiny "ping" that resets Render's sleep timer, ensuring your users never see a "Cold Start" delay.

---

## ✅ Post-Deployment Checklist
- [ ] Can I login with Google? (Check OAuth Redirects)
- [ ] Does the History page load? (Check MongoDB Connection)
- [ ] Does a "Start Hunt" trigger the browser? (Check Render Docker logs)
- [ ] Is the Excel file downloadable? (Check File System Permissions)

**Congratulations! Your AI Job Hunter is now Live.** 🎯
