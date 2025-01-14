# ============================
# 1) Builder Stage
# ============================
FROM node:20-alpine AS builder

# Install any needed build tools (Python, make, g++)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package manifests and .npmrc
COPY package*.json ./
COPY .npmrc .npmrc

# Pass the Font Awesome token as a build arg
ARG FONTAWESOME_TOKEN
ENV FONTAWESOME_TOKEN=$FONTAWESOME_TOKEN

# Install dependencies (dev + prod)
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the application (compile TypeScript, build frontend, etc.)
RUN npm run build

# ============================
# 2) Final Stage (Slimmer)
# ============================
FROM node:20-alpine

WORKDIR /app

# Copy only the final build output and node_modules from the builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
# (Optional) If you need .npmrc at runtime, copy it:
COPY --from=builder /app/.npmrc .npmrc

# Expose port 8080 for Azure
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start"]