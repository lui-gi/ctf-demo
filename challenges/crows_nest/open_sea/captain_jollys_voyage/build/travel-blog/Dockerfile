# travel-blog — Captain Jolly Wexler's hosted blog (static, nginx).
# Serves /blog/jolly-wexler/ with the chronological post listing and the
# final post "Sunset on a forgotten quay".
#
# Flag handling: the literal flag is NEVER baked into this service. The
# answer (harbour name) is derivable only by cross-referencing the
# tide-journal feed against the weather-archive index. See build-notes.md.
FROM nginx:1.27-alpine

LABEL service="travel-blog"
LABEL island="captain_jollys_voyage"

COPY site/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost/blog/jolly-wexler/ >/dev/null || exit 1
