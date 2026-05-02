# syntax=docker/dockerfile:1.7
FROM minio/mc:RELEASE.2024-11-21T17-21-54Z
COPY seed.sh /usr/local/bin/seed.sh
RUN chmod +x /usr/local/bin/seed.sh
ENTRYPOINT ["/usr/local/bin/seed.sh"]
