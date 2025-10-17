#!/usr/bin/env bash
set -euo pipefail

# Default region: Karnataka, India
REGION_URL="${1:-https://download.geofabrik.de/asia/india/karnataka-latest.osm.pbf}"

mkdir -p data/osm
cd data/osm

echo "Downloading OSM extract..."
curl -L "$REGION_URL" -o region.osm.pbf

echo "✅ Download complete: $(pwd)/region.osm.pbf"
