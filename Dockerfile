# Base Node.js image
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy package manifests and .npmrc
COPY package*.json ./
COPY .npmrc .npmrc

# Declare and set build args for the token
ARG FONTAWESOME_TOKEN
ENV FONTAWESOME_TOKEN=$FONTAWESOME_TOKEN

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the application (assuming you have a "build" script in package.json)
RUN npm run build

# Expose port 8080
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start"]