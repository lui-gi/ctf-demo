# weather-archive — Crescent Tide Authority historical tide records (static, nginx).
# Serves /charts/tides/ as the catalogue page and /charts/tides/<harbour>.csv
# for each of 12 fictional Crescent harbours, hourly resolution, 30 days.
#
# Flag handling: this service is the INTENDED hiding place for the answer.
# The harbour name (slug == flag body) appears in /charts/tides/ as one of
# 12 catalogue entries and in its own CSV file. The CHALLENGE_FLAG env var
# is accepted (for parity with sister islands) but consumed only by an
# entrypoint sanity-check; the answer string is built into the static site.
FROM nginx:1.27-alpine

LABEL service="weather-archive"
LABEL island="captain_jollys_voyage"

COPY site/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost/charts/tides/ >/dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
