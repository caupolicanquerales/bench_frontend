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

# Copiar artefactos usando comodín para evitar errores de nombrado en dist
COPY --from=build /app/dist/*/browser/ /usr/share/nginx/html/

# Copiar configuración personalizada de Nginx para Angular SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]