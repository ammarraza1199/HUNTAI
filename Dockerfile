# HuntAI - AI Job Hunter Agent
# Production Dockerfile (SeleniumBase + FastAPI)
# Optimized for Render & Cloud Environments

FROM python:3.10-slim

# 1. Environment Setup
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=10000
WORKDIR /app

# 2. Install System Dependencies for Selenium/Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    libglib2.0-0 \
    libnss3 \
    libgconf-2-4 \
    libfontconfig1 \
    libxrender1 \
    libxtst6 \
    libxi6 \
    libdbus-1-3 \
    libxcursor1 \
    libxcomposite1 \
    libxdamage1 \
    libxkbcommon0 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# 3. Install Google Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# 4. Install Python Dependencies
# We copy requirements from the backend folder
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. SeleniumBase Setup (Install correct local drivers)
RUN sbase install chromedriver

# 6. Code Ingestion
# We copy everything so the 'backend' folder exists for imports
COPY . .

# 7. Runtime
EXPOSE 10000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "10000"]
