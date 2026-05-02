# FROM ghcr.io/project-osrm/osrm-backend:v5.27.1   (keep this)
FROM ghcr.io/project-osrm/osrm-backend:v5.27.1
WORKDIR /data
COPY profiles/car.lua /opt/car.lua
COPY entrypoint.sh /app-entry.sh
RUN chmod +x /app-entry.sh
ENTRYPOINT ["/bin/sh","-c","/app-entry.sh"]
