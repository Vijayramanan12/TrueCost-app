FROM python:3.11-slim

WORKDIR /app

# Force a cold rebuild with a new timestamp
ENV REBUILD_TIMESTAMP=2026-01-24T20:30:00

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy new requirements file and install
COPY backend/reqs.txt ./requirements.txt
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
