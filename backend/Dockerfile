# Production Dockerfile with optimizations
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p storage blockchain-data && \
  chown -R node:node /app

# Use non-root user for security
USER node

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Environment variables
ENV NODE_ENV=production \
  PORT=5000

# Start server with auto-seeding
CMD ["node", "server.js"]
