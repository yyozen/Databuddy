FROM oven/bun:1-slim

WORKDIR /app

# Copy workspace files
COPY package.json bun.lock turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN bun install

# Copy API source code
COPY apps/api/ ./apps/api/

# Set environment variables
ENV NODE_ENV=production
# Expose the API port
EXPOSE 4000

# Start the API
WORKDIR /app/apps/api
CMD ["bun", "run", "src/index.ts"]