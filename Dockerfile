# Builder stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY .npmrc .npmrc

# Install dependencies
ENV NODE_ENV=development
RUN npm install

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS production

# Set working directory
WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY .npmrc .npmrc

# Install only production dependencies
ENV NODE_ENV=production
RUN npm install --only=production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 5000
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start"]