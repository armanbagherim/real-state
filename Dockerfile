FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y openssl ca-certificates --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /app
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build
FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
RUN mkdir -p uploads && chown nextjs:nodejs uploads
USER nextjs
EXPOSE 3000
CMD ["node","server.js"]
