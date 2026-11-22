FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Vite bakes VITE_* values in at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build optimized production bundle (Vite outputs to /app/dist)
RUN npm run build

# Stage 2 - Serve with Nginx
FROM nginx:1.25-alpine

# Copy build output to Nginx's public directory
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
