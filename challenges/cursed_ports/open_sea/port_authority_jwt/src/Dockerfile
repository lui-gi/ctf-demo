# syntax=docker/dockerfile:1.7
# Marrowtide Port Authority — pinned multi-stage build.

FROM node:20.11.1-alpine AS deps
WORKDIR /app
COPY package.json package.json
RUN npm install --omit=dev --no-audit --no-fund

FROM node:20.11.1-alpine AS runtime
RUN apk add --no-cache git tini \
 && addgroup -g 10001 sailor \
 && adduser -u 10001 -G sailor -D -s /sbin/nologin sailor
WORKDIR /app

# JS dependencies
COPY --from=deps /app/node_modules /app/node_modules

# App source + the .git/ history that the player will dump
COPY app.js app.js
COPY package.json package.json
COPY git_init.sh /usr/local/bin/git_init.sh
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/git_init.sh /usr/local/bin/entrypoint.sh

# Build the deployable .git history at image-build time. Two commits:
#   1) initial app.js with the literal `const JWT_SECRET = 'salt_marks_secret_2017';`
#   2) "remove debug constant — read from env" (replaces with process.env.JWT_SECRET)
RUN /usr/local/bin/git_init.sh

# Runtime user can read /app and /app/.git but cannot mutate them.
RUN chown -R sailor:sailor /app

USER sailor
EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O- http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/usr/local/bin/entrypoint.sh"]
