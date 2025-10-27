# ============================
# 🧱 BASE IMAGE
# ============================
FROM node:20-slim

# --- Create app directory ---
WORKDIR /app

# --- Copy package.json & install dependencies ---
COPY package*.json ./

# Install only prod dependencies for speed
RUN npm install --omit=dev

# --- Copy the rest of your project ---
COPY . .

# --- Set environment variables ---
ENV NODE_ENV=production \
    PORT=3000 \
    TZ=America/New_York

# --- Expose app port ---
EXPOSE 3000

# --- Start your bot ---
CMD ["npm", "start"]
