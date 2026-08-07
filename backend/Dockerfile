FROM node:20-alpine

WORKDIR /app

# Copy package files ก่อน เพื่อให้ Docker cache layer ของ npm install
COPY package*.json ./

# ติดตั้งเฉพาะ production dependencies (ไม่เอา nodemon ฯลฯ)
RUN npm install --omit=dev

# Copy source code ทั้งหมด (จะถูก filter โดย .dockerignore)
COPY . .

EXPOSE 4000

CMD ["node", "server.js"]
