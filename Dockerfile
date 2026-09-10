ARG NODE_VERSION=24-alpine

# Etapa 1: Compilación de la aplicación Angular
FROM node:${NODE_VERSION} AS build
ARG BUILD_CONFIGURATION=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build -- --configuration=${BUILD_CONFIGURATION}

# Etapa 2: Servidor Nginx
FROM nginx:stable-alpine

# Clear default Nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copiar artefactos estáticos
COPY --from=build /app/dist/bench_frontend/browser/ /usr/share/nginx/html/

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# FORCE DIRECTORY INSPECTION BEFORE NGINX STARTS
CMD ["sh", "-c", "echo '=== VERIFYING NGINX ROOT CONTENTS ===' && ls -la /usr/share/nginx/html/ && nginx -g 'daemon off;'"]