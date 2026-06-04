# ============================================================
# Dockerfile — Vue 3 Frontend
# Ubicación: sistema-cursos-fhce/frontend/Dockerfile
# ============================================================

# ------------------------------------
# ETAPA 1: BUILD
# Compila Vue 3 con Vite y genera /dist
# ------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Primero solo copiamos package.json para aprovechar cache de Docker
COPY package*.json ./
RUN npm install

# Copiamos el resto del código
COPY . .

# VITE_API_BASE_URL se pasa como argumento en docker-compose
# En producción con el proxy de Nginx, el valor es /api
# (relativo — el navegador usa el mismo servidor)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ------------------------------------
# ETAPA 2: SERVIR con Nginx
# ------------------------------------
FROM nginx:alpine

# Copiamos los archivos compilados
COPY --from=build /app/dist /usr/share/nginx/html

# Copiamos nuestra configuración de Nginx personalizada
# (necesaria para Vue Router y el proxy al backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80