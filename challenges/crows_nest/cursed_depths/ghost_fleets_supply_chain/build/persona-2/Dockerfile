# Kaspar Threnody — personal site (static)
FROM nginx:1.27-alpine
LABEL service="persona-kaspar-threnody"
LABEL island="ghost_fleets_supply_chain"
COPY site/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost/ >/dev/null || exit 1
