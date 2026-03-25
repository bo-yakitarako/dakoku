FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV TZ=Asia/Tokyo

RUN apk add --no-cache tzdata && \
  cp /usr/share/zoneinfo/$TZ /etc/localtime && \
  echo $TZ > /etc/timezone && \
  corepack enable

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
