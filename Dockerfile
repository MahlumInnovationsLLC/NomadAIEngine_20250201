### =========== 1) BUILDER STAGE =============
FROM node:20-alpine AS builder

# If you compile native modules, you may need:
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy your package JSON and .npmrc (if needed for private packages)
COPY package*.json ./
COPY .npmrc .npmrc

ARG FONTAWESOME_TOKEN
ENV FONTAWESOME_TOKEN=$FONTAWESOME_TOKEN

# Install all dependencies (dev + prod)
RUN npm install

# Copy source, build
COPY . .
RUN npm run build

# We can optionally prune out dev dependencies
RUN npm prune --production

### =========== 2) FINAL STAGE ==============
FROM node:20-slim

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
# Copy compiled code
COPY --from=builder /app/dist ./dist

EXPOSE 8080

# Start the app (assuming “start” runs “node dist/index.js” or similar)
CMD ["npm", "run", "start"]