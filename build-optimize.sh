#!/bin/bash

# Production Build Optimization Script for React Task Manager

echo "🚀 Starting production build optimization..."

# Set production environment
export NODE_ENV=production

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf build/

# Install dependencies if needed
echo "📦 Checking dependencies..."
npm ci --only=production

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level=moderate

# Build the application
echo "🏗️  Building application..."
npm run build

# Analyze bundle size
echo "📊 Analyzing bundle size..."
if command -v npx &> /dev/null; then
    npx webpack-bundle-analyzer dist/assets/*.js --report --mode static --open=false --report-filename=../bundle-report.html
fi

# Compress assets
echo "🗜️  Compressing assets..."
if command -v gzip &> /dev/null; then
    find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec gzip -9 -k {} \;
fi

# Generate service worker
echo "⚙️  Generating service worker..."
cat > dist/sw.js << 'EOF'
const CACHE_NAME = 'task-manager-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
EOF

# Create optimized nginx configuration
echo "🌐 Creating nginx configuration..."
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (adjust as needed)
    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Create Docker production image
echo "🐳 Creating production Dockerfile..."
cat > Dockerfile.prod << 'EOF'
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# Create docker-compose for production
echo "🐳 Creating production docker-compose..."
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - app-network

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    networks:
      - app-network
    depends_on:
      - mongodb

  mongodb:
    image: mongo:6-jammy
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped
    networks:
      - app-network

volumes:
  mongodb_data:

networks:
  app-network:
    driver: bridge
EOF

# Performance report
echo "📈 Generating performance report..."
cat > performance-report.md << 'EOF'
# Production Build Performance Report

## Bundle Analysis
- Check `bundle-report.html` for detailed bundle analysis
- Look for duplicate dependencies and large unused libraries

## Optimization Checklist
- [x] Code splitting implemented
- [x] Lazy loading for routes
- [x] Asset compression (gzip)
- [x] Cache headers configured
- [x] Service worker generated
- [x] Docker production image created

## Recommendations
1. Monitor Core Web Vitals in production
2. Implement proper CDN for static assets
3. Set up performance monitoring
4. Regular bundle analysis
5. Database query optimization

## Security Measures
- Security headers configured in nginx
- Content Security Policy implemented
- Dependencies audited for vulnerabilities

## Deployment
Use `docker-compose -f docker-compose.prod.yml up -d` to deploy
EOF

# Calculate build size
if [ -d "dist" ]; then
    BUILD_SIZE=$(du -sh dist | cut -f1)
    echo "📦 Build size: $BUILD_SIZE"
fi

echo "✅ Production build optimization complete!"
echo "📋 Check performance-report.md for details"
echo "🐳 Use docker-compose.prod.yml for production deployment"