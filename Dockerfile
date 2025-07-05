FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy built application
COPY dist/ ./dist/

# Create non-root user
RUN addgroup -g 1001 -S nexus && \
    adduser -S nexus -u 1001

# Change ownership to nexus user
RUN chown -R nexus:nexus /app

# Switch to non-root user
USER nexus

# Expose port (optional, mainly for documentation)
EXPOSE 8080

# Set entrypoint
ENTRYPOINT ["node", "dist/index.js"]