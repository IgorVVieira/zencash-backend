FROM node:24.12.0-alpine3.23 AS builder

# Necessário para Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Melhor uso de cache
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY prisma ./prisma

# Instala todas dependências (incluindo dev)
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate
RUN pnpm install --frozen-lockfile

# Gera Prisma Client
RUN npx prisma generate

# Copia restante do código
COPY . .

# Build do TypeScript
RUN pnpm build

FROM node:24.12.0-alpine3.23 AS prod

RUN apk add --no-cache openssl

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

ENV NODE_ENV=production
ENV HUSKY=0

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Instala somente prod deps (evita copiar e depois prunar tudo)
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate
RUN pnpm install --frozen-lockfile --prod

# Gera Prisma Client com binários corretos para Alpine
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

# Copiar build e swagger
COPY --from=builder /app/dist ./dist
COPY swagger.json ./swagger.json

# Ajustar permissões
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["pnpm", "start:prod"]

# docker build -t zencash-backend .
# docker start -i zencash-backend
