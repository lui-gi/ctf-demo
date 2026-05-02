# syntax=docker/dockerfile:1.7
# drowned_admin — Express + SQLite intentionally vulnerable login.
# Multi-stage to keep the runtime image free of build toolchain.

FROM node:20.11.1-alpine AS build
WORKDIR /build
RUN apk add --no-cache python3 make g++
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund \
 && npm cache clean --force

FROM node:20.11.1-alpine AS runtime

# Dedicated unprivileged user — sandbox controller refuses any image that
# ends with USER root.
RUN addgroup -S sailor -g 10001 \
 && adduser  -S sailor -G sailor -u 10001 -h /home/sailor

WORKDIR /app

# ca-certs not strictly needed but kept for parity with infra defaults; tini
# handles SIGTERM cleanly when the controller scales the deployment to zero
# on TTL idle.
RUN apk add --no-cache tini

COPY --chown=sailor:sailor --from=build /build/node_modules ./node_modules
COPY --chown=sailor:sailor package.json ./package.json
COPY --chown=sailor:sailor src/ ./src/

# CHALLENGE_FLAG is injected at runtime from the K8s island-flags Secret by
# the sandbox controller. The placeholder below is intentionally invalid so
# the app fail-closes if the secret was not wired up.
ENV CHALLENGE_FLAG="progctf{REPLACE_AT_RUNTIME_FROM_SECRET}" \
    CHALLENGE_PORT=8080 \
    NODE_ENV=production \
    PORT=8080

USER sailor:sailor
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:8080/healthz || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/app.js"]
