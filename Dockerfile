ARG NODE_VERSION=24-alpine

# Stage 1: Build
FROM node:${NODE_VERSION} AS build
ARG BUILD_CONFIGURATION=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build -- --configuration=${BUILD_CONFIGURATION}

# Debug step to inspect built output
RUN echo "=== CONTENTS OF DIST ===" && ls -la /app/dist/ && ls -la /app/dist/bench_frontend/

# Stage 2: Serve
FROM nginx:stable-alpine

ARG COMMIT_SHA=unknown
ENV BUILD_SHA=${COMMIT_SHA}

# Clear default Nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built Angular browser assets directly into root
COPY --from=build /app/dist/bench_frontend/browser/. /usr/share/nginx/html/

# Copy Nginx SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]