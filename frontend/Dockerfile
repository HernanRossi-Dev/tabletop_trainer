# frontend/Dockerfile

# --- Stage 1: Build the SolidJS application ---
    FROM node:23-slim AS builder

    WORKDIR /app
    
    # Copy package definition and lock file
    COPY package.json package-lock.json* ./
    # Or for yarn: COPY package.json yarn.lock ./
    # Or for pnpm: COPY package.json pnpm-lock.yaml ./
    
    # Install dependencies using the appropriate command
    RUN npm ci
    # Or for yarn: RUN yarn install --frozen-lockfile
    # Or for pnpm: RUN pnpm install --frozen-lockfile
    
    # Copy the rest of the frontend source code
    COPY . .
    
    # Build the application for production
    RUN npm run build
    # Or: yarn build / pnpm build
    
    # --- Stage 2: Serve using Nginx ---
    FROM nginx:stable-alpine
    
    # Copy the built static files from the 'builder' stage
    # Adjust '/app/dist' if your build output directory is different (check vite.config.js or similar)
    COPY --from=builder /app/dist /usr/share/nginx/html
    
    # Remove default Nginx welcome page (optional)
    RUN rm /etc/nginx/conf.d/default.conf
    
    # Copy your custom Nginx configuration (we'll mount this via docker-compose usually,
    # but copying it here makes the image self-contained if needed. Mounting is more flexible.)
    # COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    EXPOSE 80
    
    # Nginx will start automatically by its default command
    CMD ["nginx", "-g", "daemon off;"]