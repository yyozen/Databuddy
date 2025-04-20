# Use the official Bun image
FROM oven/bun:1 as builder

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json ./
COPY bun.lockb ./
COPY pnpm-workspace.yaml ./

# Copy all packages
COPY packages ./packages

# Copy the API app
COPY apps/api ./apps/api

# Set working directory to the API app
WORKDIR /app/apps/api

# Install dependencies
RUN bun install --frozen-lockfile

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-slim

# Set working directory
WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/bun.lockb ./

# Copy required packages
COPY --from=builder /app/packages/auth ./packages/auth
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/packages/logger ./packages/logger
COPY --from=builder /app/packages/queue ./packages/queue
COPY --from=builder /app/packages/redis ./packages/redis
COPY --from=builder /app/packages/trpc ./packages/trpc

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["bun", "run", "dist/index.js"]
