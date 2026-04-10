# backend/Dockerfile
# HuntAI - AI Job Hunter Agent
# Deployable container for Render/Docker

FROM mcr.microsoft.com/playwright/python:v1.41.0-jammy

# 1. Environment Setup
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
WORKDIR /app

# 2. Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Code Ingestion
COPY . .

# 4. Final Prep: Playwright browsers
# Render/Docker environments usually need these pre-baked
RUN playwright install chromium
RUN playwright install-deps chromium

# 5. Runtime
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
