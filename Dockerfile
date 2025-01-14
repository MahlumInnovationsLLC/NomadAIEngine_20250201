FROM node:20-alpine as builder
RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY package*.json ./
COPY .npmrc .npmrc

# Install dev + prod deps
RUN npm install

COPY . .

# Build your app
RUN npm run build

# ==================================
# Distroless or Slim final image
# ==================================
# If you want distroless, do:
# FROM gcr.io/distroless/nodejs:20
# or if you want Node.js slim:
FROM node:20-slim

WORKDIR /app

# Just copy your final package.json
COPY package*.json ./
COPY .npmrc .npmrc

# Only install production deps
RUN npm install --omit=dev

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD ["npm", "run", "start"]