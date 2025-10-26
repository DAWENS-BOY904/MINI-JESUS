# ==================== FIXED Dockerfile ====================
# Use the official Node.js LTS image
FROM node:lts-bullseye

# Set working directory
WORKDIR /app

# Install dependencies (media tools + git)
RUN apt-get update && \
    apt-get install -y ffmpeg imagemagick webp git curl && \
    rm -rf /var/lib/apt/lists/*

# Install PM2 globally
RUN npm install -g pm2

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --omit=dev

# Copy project files
COPY . .

# Create session directory
RUN mkdir -p /app/session

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER node

# Start the app
CMD ["pm2-runtime", "start", "index.js"]
