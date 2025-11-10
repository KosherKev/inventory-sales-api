# Inventory & Sales API - Dockerfile
# Lightweight Node.js image suitable for Cloud Run

FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# Using npm ci for reproducible installs and omitting devDependencies in production
COPY package*.json ./
RUN npm ci --omit=dev

# Bundle app source
COPY src ./src

# Environment configuration
ENV NODE_ENV=production
# Cloud Run sets PORT; default to 8080 for local run
ENV PORT=8080

# Expose the port the app listens on
EXPOSE 8080

# Start the server
CMD ["node", "src/server.js"]