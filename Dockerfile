# Multi-stage build for ultra-lightweight production image
FROM oven/bun:alpine AS base
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Production dependencies stage
FROM base AS deps
RUN bun install --frozen-lockfile --production

# Build stage (if you have build steps)
FROM base AS builder
COPY . .
RUN bun install --frozen-lockfile
# Add any build commands here if needed
# RUN bun run build

# Production stage - ultra minimal
FROM oven/bun:alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bunuser -u 1001

WORKDIR /app

# Copy only production dependencies and built app
COPY --from=deps --chown=bunuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=bunuser:nodejs /app .
RUN mkdir -p /app/data && \
    chown -R bunuser:nodejs /app/data && \
    chmod 755 /app/data

# Remove unnecessary files to minimize image size
RUN rm -rf \
    /tmp/* \
    /var/cache/apk/* \
    .git* \
    *.md \
    tests/ \
    docs/ \
    examples/ \
    __tests__/ \
    .env.example

# Switch to non-root user
USER bunuser

# Expose port (adjust as needed)
EXPOSE 3000

# Use exec form for proper signal handling
CMD ["bun", "run", "--bun", "start"]
