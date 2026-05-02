# syntax=docker/dockerfile:1.7
FROM python:3.12-alpine
RUN pip install --no-cache-dir flask==3.0.3 \
 && addgroup -g 10001 sailor && adduser -u 10001 -G sailor -D -s /sbin/nologin sailor
WORKDIR /app
COPY app.py app.py
USER sailor
EXPOSE 80
CMD ["python", "app.py"]
