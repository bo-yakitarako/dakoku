FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apk add --no-cache tzdata fontconfig ttf-dejavu ttf-liberation && \
  cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
  echo "Asia/Tokyo" > /etc/timezone && \
  fc-cache -fv

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY server/package.json ./package.json
COPY server/pnpm-lock.yaml ./pnpm-lock.yaml
COPY server/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN pnpm install --frozen-lockfile

COPY server/ /app/

RUN pnpm build

RUN cat <<'EOF' > /usr/local/bin/docker-entrypoint.sh
#!/bin/sh
set -eu

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  pnpm db:migrate
fi

exec node dist/index.js
EOF

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["docker-entrypoint.sh"]
