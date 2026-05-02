# tide-journal — Captain Jolly Wexler's RSS tide log (static, nginx).
# Serves /blog/jolly-wexler/tide.rss as application/rss+xml so the player
# can pull it with `curl` and immediately read the latest entry.
#
# Flag handling: the literal flag is NEVER baked into this service. The
# RSS only records readings; the player must cross-reference the latest
# reading against the weather-archive to find the harbour.
FROM nginx:1.27-alpine

LABEL service="tide-journal"
LABEL island="captain_jollys_voyage"

COPY site/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost/blog/jolly-wexler/tide.rss >/dev/null || exit 1
