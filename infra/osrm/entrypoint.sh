#!/usr/bin/env bash
set -euo pipefail
: "${OSM_PBF:=/data/region.osm.pbf}"
: "${PROFILE:=/opt/car.lua}"

if [ ! -f "$OSM_PBF" ]; then
  echo "❌ Missing $OSM_PBF"; exit 1
fi

echo "🚀 Extracting & partitioning OSM data..."
osrm-extract -p "$PROFILE" "$OSM_PBF"
osrm-partition /data/region.osrm
osrm-customize /data/region.osrm

echo "✅ Data prepared — starting osrm-routed..."
exec osrm-routed --algorithm mld /data/region.osrm
