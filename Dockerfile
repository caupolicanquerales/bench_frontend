ARG NODE_VERSION=24-alpine

# Etapa 1: Compilación de la aplicación Angular
FROM node:${NODE_VERSION} AS build
ARG BUILD_CONFIGURATION=production

WORKDIR /app

# Copiar manifiestos de dependencias e instalarlas
COPY package*.json ./
RUN npm ci --silent

# Copiar código fuente y compilar para producción
COPY . .
RUN npm run build -- --configuration=${BUILD_CONFIGURATION}

# Etapa 2: Servidor Nginx para servir los archivos estáticos
FROM nginx:stable-alpine

# Limpiar archivos por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar todo el contenido compilado a Nginx
COPY --from=build /app/dist /tmp/dist

# Buscar dinámicamente dónde quedó index.html y mover todos los estáticos a Nginx
RUN if [ -d "/tmp/dist/bench_frontend/browser" ]; then \
        cp -r /tmp/dist/bench_frontend/browser/* /usr/share/nginx/html/; \
    elif [ -d "/tmp/dist/bench_frontend" ]; then \
        cp -r /tmp/dist/bench_frontend/* /usr/share/nginx/html/; \
    else \
        cp -r $(dirname $(find /tmp/dist -name index.html | head -n 1))/* /usr/share/nginx/html/; \
    fi && rm -rf /tmp/dist

# Copiar configuración personalizada de Nginx para Angular SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]