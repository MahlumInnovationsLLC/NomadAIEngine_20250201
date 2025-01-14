### =========== 1) BUILDER STAGE =============
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

# If you need private FontAwesome packages, also copy .npmrc
COPY package*.json ./
COPY .npmrc .npmrc

# Pass font token here if needed
ARG FONTAWESOME_TOKEN
ENV FONTAWESOME_TOKEN=$FONTAWESOME_TOKEN

# Install all dependencies (dev + prod)
RUN npm install

# Copy source, build
COPY . .
RUN npm run build

### =========== 2) FINAL STAGE ==============
FROM node:20-slim
WORKDIR /app

# (Optional) Copy .npmrc if your app reads it at runtime, or remove if not needed
COPY --from=builder /app/.npmrc .npmrc

# Copy compiled output
COPY --from=builder /app/dist ./dist

# **Also** copy node_modules from builder to final
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 8080
CMD ["npm", "run", "start"]