# Use official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Make port 5001 available to the world outside this container
EXPOSE 5001

# Define environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
# Run the application with gunicorn for production
# Use the PORT environment variable provided by Render
CMD gunicorn --bind 0.0.0.0:$PORT app:app
