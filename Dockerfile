ARG PROJECT_NAME=bench_frontend
ARG NODE_VERSION=22-alpine
ARG BUILD_CONFIGURATION=production

# Etapa 1: Compilación de la aplicación Angular
FROM node:${NODE_VERSION} AS build
ARG PROJECT_NAME
ARG BUILD_CONFIGURATION

WORKDIR /app

# Copiar manifiestos de dependencias e instalarlas
COPY package*.json ./
RUN npm ci --silent

# Copiar código fuente y compilar para producción
COPY . .
RUN npm run build -- --configuration=${BUILD_CONFIGURATION}

# Etapa 2: Servidor Nginx para servir los archivos estáticos
FROM nginx:stable-alpine
ARG PROJECT_NAME

# Limpiar archivos por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar artefactos compilados del cliente (browser)
COPY --from=build /app/dist/${PROJECT_NAME}/browser/ /usr/share/nginx/html/

# Copiar configuración personalizada de Nginx para Angular SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
