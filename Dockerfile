ARG NODE_VERSION=24-alpine

# Etapa 1: Compilación de la aplicación Angular
FROM node:${NODE_VERSION} AS build
ARG BUILD_CONFIGURATION=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build -- --configuration=${BUILD_CONFIGURATION}

# Etapa 2: Servidor Nginx para servir los archivos estáticos (Client-Side)
FROM nginx:stable-alpine

RUN rm -rf /usr/share/nginx/html/*

# Copiar explícitamente la carpeta del navegador (browser) desde el build de Angular SSR
COPY --from=build /app/dist/bench_frontend/browser/ /usr/share/nginx/html/

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]