FROM node:20-alpine

# Install useful tools for the Claude agent's sandbox:
# - git: to clone/commit/push the repo (self-deploy via GitHub PAT)
# - bash, curl, wget: standard shell + http
# - python3 + pip: data scripts the agent might want to run
# - jq: JSON manipulation
# - ca-certificates: TLS for HTTPS
RUN apk add --no-cache \
    bash \
    git \
    curl \
    wget \
    jq \
    python3 \
    py3-pip \
    ca-certificates \
    tzdata \
 && update-ca-certificates

# Create app + work directories
WORKDIR /app
RUN mkdir -p /app/data /app/work

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy all files (server.js, HTML files, etc.)
COPY . .

# Default timezone for nicer logs/timestamps
ENV TZ=Asia/Jerusalem

# Expose HTTP port
EXPOSE 80

# Start the server
CMD ["node", "server.js"]
