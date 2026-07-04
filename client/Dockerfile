FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY tailwind.config.js postcss.config.js index.html vite.config.ts ./
COPY src/ ./src

# Build production bundle
RUN npm run build

FROM nginx:alpine

# Copy built assets to Nginx default folder
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to support SPA routing fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
