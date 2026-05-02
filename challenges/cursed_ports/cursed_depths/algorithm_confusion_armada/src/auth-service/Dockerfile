# syntax=docker/dockerfile:1.7
FROM node:20.11.1-alpine AS deps
WORKDIR /app
COPY package.json package.json
RUN npm install --omit=dev --no-audit --no-fund

FROM node:20.11.1-alpine AS runtime
RUN apk add --no-cache openssl tini \
 && addgroup -g 10001 sailor && adduser -u 10001 -G sailor -D -s /sbin/nologin sailor
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY app.js package.json ./
RUN mkdir -p /app/keys \
 && openssl genrsa -out /app/keys/private.pem 2048 \
 && openssl rsa -in /app/keys/private.pem -pubout -out /app/keys/public.pem \
 && chown -R sailor:sailor /app
USER sailor
EXPOSE 8080
ENV NODE_ENV=production PORT=8080
ENV PRIV_KEY_PATH=/app/keys/private.pem PUB_KEY_PATH=/app/keys/public.pem
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O- http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "/app/app.js"]
