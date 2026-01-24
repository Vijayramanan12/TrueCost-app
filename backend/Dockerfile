FROM python:3.11-slim

WORKDIR /app
ENV REBUILD_AT=2026-01-24T19:50:00

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Use root-relative paths for COPY because Railway uses the repo root as context
COPY backend/requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend files
COPY backend/ .

# Ensure the upload directory exists
RUN mkdir -p uploads

# The PORT is provided by Railway
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

CMD gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 180 --log-level debug app:app
