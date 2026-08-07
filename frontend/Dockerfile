# ---- Stage 1: Build React app ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files ก่อน เพื่อ cache layer
COPY package*.json ./
RUN npm install

# Copy source code และ build
COPY . .
RUN npm run build

# ---- Stage 2: Serve ด้วย Nginx (เบากว่า Node.js มาก) ----
FROM nginx:alpine

# Copy static files จาก builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx config ที่ทำ proxy /api → backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
