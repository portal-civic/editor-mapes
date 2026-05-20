FROM node:20-slim

# Install Python 3 + pip (needed by the overturemaps CLI)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
  && rm -rf /var/lib/apt/lists/*

# Install overturemaps CLI into an isolated venv to avoid PEP 668 conflicts
RUN python3 -m venv /opt/overturemaps-venv \
  && /opt/overturemaps-venv/bin/pip install --no-cache-dir overturemaps

# Add the venv bin to PATH so `overturemaps` is on PATH in the container
ENV PATH="/opt/overturemaps-venv/bin:${PATH}"

WORKDIR /app

COPY package.json ./
RUN npm ci --omit=dev

COPY . .

# Ensure the cache directory exists and is writable
RUN mkdir -p cache/overture

EXPOSE 3000

CMD ["node", "server.js"]
