```mermaid
architecture-beta
    group cdn(cloud)[CDN / Static Hosting]
    group api_tier(server)[API Tier]
    group data_tier(database)[Data Tier]
    group infra(cloud)[Infra]

    service browser(internet)[~300 Concurrent Players]
    service spa(disk)[React SPA - Vite Build] in cdn

    service lb(server)[Load Balancer] in api_tier
    service api1(server)[Express API - Node 1] in api_tier
    service api2(server)[Express API - Node 2] in api_tier
    service ws(server)[WebSocket Server - Live Scoreboard] in api_tier

    service pg(database)[PostgreSQL - Users / Challenges / Solves] in data_tier
    service redis(database)[Redis - Sessions / Leaderboard Cache / Pub-Sub] in data_tier
    service s3(disk)[Object Storage - Challenge Assets / Flag Files] in data_tier

    service monitor(server)[Metrics + Alerting] in infra

    browser:R --> L:spa
    browser:B --> T:lb
    lb:R --> L:api1
    lb:R --> L:api2
    lb:B --> T:ws
    api1:B --> T:pg
    api2:B --> T:pg
    api1:R --> L:redis
    api2:R --> L:redis
    ws:R --> L:redis
    api1:B --> T:s3
    api2:B --> T:s3
    api1:T --> B:monitor
    api2:T --> B:monitor
```
