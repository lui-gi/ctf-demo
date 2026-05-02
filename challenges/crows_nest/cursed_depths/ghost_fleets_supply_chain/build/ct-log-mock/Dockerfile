# crt.marrowtide.example — certificate transparency log mock (Express)
FROM node:20-alpine

LABEL service="ct-log-mock"
LABEL island="ghost_fleets_supply_chain"

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY src/ ./src/

EXPOSE 80
ENV PORT=80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost/ping >/dev/null || exit 1

CMD ["node", "src/server.js"]
