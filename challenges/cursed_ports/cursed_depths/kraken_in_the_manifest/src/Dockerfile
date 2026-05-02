# syntax=docker/dockerfile:1.7
FROM node:20.11.1-alpine AS deps
WORKDIR /app
COPY package.json package.json
# Strict install — exact pinned versions only (ejs@3.1.6 is critical to the gadget).
RUN npm install --omit=dev --no-audit --no-fund --no-package-lock

FROM node:20.11.1-alpine AS runtime
RUN apk add --no-cache tini \
 && addgroup -g 10001 sailor \
 && adduser -u 10001 -G sailor -D -s /sbin/nologin sailor

# /treasure is the file the SSTI gadget will read; placed at FS root, owned
# by root, world-readable. Sailor user can read but not modify.
RUN echo "progctf{the_kraken_polluted_my_prototype}" > /treasure \
 && chown root:root /treasure \
 && chmod 644 /treasure

WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY app.js package.json ./
RUN chown -R sailor:sailor /app
USER sailor
EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O- http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "/app/app.js"]
