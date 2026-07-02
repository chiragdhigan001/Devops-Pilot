# ---- Backend builder ----
FROM node:20-alpine AS backend-builder
WORKDIR /app
RUN apk add --no-cache git
COPY apps/backend/package*.json ./apps/backend/
RUN cd apps/backend && npm ci --only=production
COPY apps/backend ./apps/backend

# ---- Frontend builder ----
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY apps/frontend/package*.json ./apps/frontend/
RUN cd apps/frontend && npm ci
COPY apps/frontend ./apps/frontend
RUN cd apps/frontend && npm run build

# ---- Runtime ----
FROM node:20-alpine
RUN apk add --no-cache git docker-cli docker-compose

WORKDIR /app

# Copy backend source + node_modules
COPY --from=backend-builder /app/apps/backend ./apps/backend
COPY --from=backend-builder /app/node_modules ./node_modules 2>/dev/null || true
COPY package.json ./

# Copy frontend build
COPY --from=frontend-builder /app/apps/frontend/dist ./apps/frontend/dist

# Create logs directory
RUN mkdir -p /app/logs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

ENV NODE_ENV=production
CMD ["node", "apps/backend/server.js"]
