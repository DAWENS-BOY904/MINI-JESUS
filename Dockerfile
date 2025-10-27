# ============================
# 🧱 BASE IMAGE PRO
# ============================
FROM node:20-bullseye

# --- Workdir ---
WORKDIR /app

# --- Install dependencies system pou bot ---
RUN apt-get update && apt-get install -y \
  git \
  ffmpeg \
  python3 \
  build-essential \
  chromium \
  fonts-noto-color-emoji \
  curl \
  && rm -rf /var/lib/apt/lists/*

# --- Copy package.json & install npm deps ---
COPY package*.json ./

RUN npm install --omit=dev

# --- Copy tout code ---
COPY . .

# --- Set environment ---
ENV NODE_ENV=production \
    PORT=3000 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    TZ=America/New_York

# --- Expose port ---
EXPOSE 3000

# --- Start bot ---
CMD ["npm", "start"]
