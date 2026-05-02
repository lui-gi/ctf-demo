# vault.marrowtide.example — hidden page service.
# Renders /known-issues/cgo7w3.html by templating the 5 alt attributes from the
# CHALLENGE_FLAG environment variable at container start. The flag literal is
# NEVER baked into the image source.
FROM nginx:1.27-alpine

LABEL service="hidden-page"
LABEL island="ghost_fleets_supply_chain"

COPY site/ /site/
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost/.well-known/security.txt >/dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
