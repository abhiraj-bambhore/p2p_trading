FROM python:3.11-slim

# System deps needed by scipy/pypsa/opencv
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies (skip torch/flwr — too large, optional anyway)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        fastapi==0.111.0 \
        "uvicorn[standard]==0.29.0" \
        websockets==12.0 \
        pydantic==2.7.1 \
        httpx==0.27.0 \
        python-dotenv==1.0.1 \
        aiofiles==23.2.1 \
        numpy==1.26.4 \
        pandas==2.2.2 \
        scipy==1.13.0 \
        pypsa==0.27.0 \
        opencv-python-headless==4.9.0.80 \
        cryptography==42.0.7 \
        requests==2.31.0 \
        aiosmtplib==3.0.1 \
        web3==6.20.0

# Copy application code
COPY . .

EXPOSE 10000

# Use shell form so $PORT is expanded at runtime (Render sets PORT=10000)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}
