FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY apps/backend/package*.json ./apps/backend/
RUN cd apps/backend && npm ci
COPY apps/backend ./apps/backend

FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY apps/frontend/package*.json ./apps/frontend/
RUN cd apps/frontend && npm ci
COPY apps/frontend ./apps/frontend
RUN cd apps/frontend && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=backend-builder /app/apps/backend ./apps/backend
COPY --from=frontend-builder /app/apps/frontend/dist ./apps/frontend/dist
COPY package.json ./
EXPOSE 5000
CMD ["node", "apps/backend/server.js"]
