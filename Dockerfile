# Use Node 18 Alpine via Google's Docker Hub mirror (avoids Docker Hub 401 when not logged in)
FROM mirror.gcr.io/library/node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install curl for health checks
RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# Copy the standalone output which includes server.js and all necessary dependencies
# The standalone output structure is: .next/standalone/ contains the server files
# We need to copy the entire standalone directory structure
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files (standalone output does not include static files)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public assets (standalone output expects public folder at root)
# Use --chown to ensure proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Ensure .next directory exists with proper permissions
RUN mkdir -p .next && chown -R nextjs:nodejs .next

# Switch to non-root user for security
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check to ensure the container is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://0.0.0.0:3000/health || exit 1

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["sh", "-c", "node server.js"]
