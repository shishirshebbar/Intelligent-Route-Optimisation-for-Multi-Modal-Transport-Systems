FROM osrm/osrm-backend:v5.27.0
WORKDIR /data
COPY profiles/car.lua /opt/car.lua
COPY entrypoint.sh /app-entry.sh
RUN chmod +x /app-entry.sh
ENTRYPOINT ["/bin/sh","-c","/app-entry.sh"]
