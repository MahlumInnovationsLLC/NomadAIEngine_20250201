# Builder stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json .npmrc ./

# Install dependencies with specific flags to reduce size
ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=error \
    NPM_CONFIG_PRODUCTION=true \
    NPM_CONFIG_PREFER_OFFLINE=true \
    NODE_OPTIONS="--max-old-space-size=2048"

RUN npm ci --only=production --no-optional --prefer-offline && \
    npm cache clean --force && \
    du -sh /app/node_modules || true  # Monitor node_modules size

# Copy source files
COPY . .

# Build the application
RUN npm run build && \
    du -sh /app/dist || true && \  # Monitor build size
    rm -rf node_modules # Remove node_modules after build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json .npmrc ./

# Install only production dependencies with aggressive optimization
ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=error \
    NPM_CONFIG_PRODUCTION=true \
    NPM_CONFIG_PREFER_OFFLINE=true \
    NODE_OPTIONS="--max-old-space-size=2048"

RUN npm ci --only=production --no-optional --prefer-offline && \
    npm cache clean --force && \
    npm prune --production && \
    du -sh /app/node_modules || true  # Monitor production node_modules size

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Remove unnecessary files and show final size
RUN rm -rf .npmrc package*.json \
           /usr/local/lib/node_modules \
           /usr/local/share/.cache \
           /root/.npm \
           /tmp/* && \
    du -sh /app || true && \
    find /app -type f -ls  # List all files for size analysis

# Expose the port from environment variable
# The PORT environment variable will be set by the hosting platform
EXPOSE ${PORT:-5000}

# Start the application
CMD ["node", "dist/index.js"]