# Base image
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package*.json ./
RUN npm ci --production

# Generate Prisma Client
FROM base AS prisma
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

# Build application
FROM base AS builder
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate

# Production image
FROM base AS runner
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy Prisma client
COPY --from=prisma --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma --chown=nodejs:nodejs /app/prisma ./prisma

# Copy application code
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "src/index.js"]