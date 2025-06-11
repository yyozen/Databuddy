# Build stage
FROM oven/bun:1-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock turbo.json ./
COPY apps/dash2/package.json ./apps/dash2/
COPY packages/ ./packages/

# Install dependencies
RUN bun install 
RUN bun run build

# Copy source code
COPY apps/dash2/ ./apps/dash2/

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/dash2 ./apps/dash2
COPY --from=builder /app/packages ./packages

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    BUN_ENV=production

# Expose port
EXPOSE 3000
# Start API
WORKDIR /app/apps/dash2
CMD ["bun", "run", "start"]