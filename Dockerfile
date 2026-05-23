FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy all files (server.js, HTML files, etc.)
COPY . .

# Create data directory for persistent storage (Google OAuth tokens)
RUN mkdir -p /app/data

# Expose HTTP port
EXPOSE 80

# Start the server
CMD ["node", "server.js"]
