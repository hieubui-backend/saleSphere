# Stage 1: Build TypeScript → JavaScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files trước để tận dụng Docker layer cache
COPY package*.json ./
RUN npm ci

# Copy toàn bộ source code và build
COPY . .
RUN npm run build


# Stage 2: Production image (gọn nhẹ, không có devDependencies)
FROM node:20-alpine AS production

WORKDIR /app

# Biến môi trường production
ENV NODE_ENV=production

# Chỉ cài production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output từ stage builder
COPY --from=builder /app/dist ./dist

# Copy thư mục public (ảnh, static files)
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 5000

# Chạy với user non-root (bảo mật)
RUN mkdir -p logs && chown -R node:node logs
USER node

CMD ["node", "dist/server.js"]
