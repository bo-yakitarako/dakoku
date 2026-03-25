FROM node:22-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV TZ=Asia/Tokyo

RUN apk add --no-cache tzdata && \
  cp /usr/share/zoneinfo/$TZ /etc/localtime && \
  echo $TZ > /etc/timezone && \
  corepack enable

WORKDIR /app

COPY . ./

ENV NODE_ENV=development

RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm build

ENV NODE_ENV=production

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
