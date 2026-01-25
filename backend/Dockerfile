FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and clear pip cache
RUN pip install --upgrade pip && \
    pip cache purge

# Copy requirements first for better caching
COPY backend/reqs.txt ./requirements.txt

# Install Python dependencies
RUN pip install -r requirements.txt

# Copy the rest of the backend files
COPY backend/ .

# Ensure the upload directory exists
RUN mkdir -p uploads

# The PORT is provided by Railway
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

CMD gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 180 --log-level debug app:app