### =========== 1) BUILDER STAGE =============
FROM node:20-alpine AS builder

# If needed, for native builds
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY .npmrc .npmrc

ARG FONTAWESOME_TOKEN
ENV FONTAWESOME_TOKEN=$FONTAWESOME_TOKEN

# Install dependencies (dev + prod)
RUN npm install

# Copy source, build
COPY . .
RUN npm run build

### =========== 2) FINAL STAGE ==============
FROM node:20-slim
WORKDIR /app

# (Optional) copy .npmrc if your runtime needs it
COPY --from=builder /app/.npmrc .npmrc

# Copy compiled code & node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 8080

# Typical Node start (assuming "start" script uses dist/ and process.env.PORT)
CMD ["npm", "run", "start"]