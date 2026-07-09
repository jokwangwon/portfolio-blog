# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

# 의존성 설치 (lockfile 기반, 캐시 활용)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 개발용 — docker-compose가 target: development로 빌드, 소스는 볼륨 마운트로 주입
FROM deps AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# 프로덕션 빌드
FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 프로덕션 런타임
FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json next.config.ts ./
EXPOSE 3000
CMD ["npm", "start"]
