ARG PROJECT_NAME=bench_frontend
ARG NODE_VERSION=22-alpine
ARG BUILD_CONFIGURATION=production

FROM node:${NODE_VERSION} AS build
ARG PROJECT_NAME
ARG BUILD_CONFIGURATION

WORKDIR /app
COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build -- --configuration=${BUILD_CONFIGURATION}

FROM nginx:stable-alpine
ARG PROJECT_NAME
RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist/${PROJECT_NAME}/browser/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]