# Use Node.js LTS Alpine image for a lightweight container
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package descriptors first to leverage Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Expose the port (default 3000)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
