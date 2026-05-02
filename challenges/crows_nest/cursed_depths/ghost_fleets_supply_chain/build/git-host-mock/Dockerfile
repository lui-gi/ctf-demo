# git.marrowtide.example — Gitea-style static landing
FROM nginx:1.27-alpine
LABEL service="git-host-mock"
LABEL island="ghost_fleets_supply_chain"
COPY site/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost/ >/dev/null || exit 1
