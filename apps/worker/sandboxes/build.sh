#!/bin/sh
set -e
cd "$(dirname "$0")"

docker build -t judge-js-runner   ./js
docker build -t judge-py-runner   ./py
docker build -t judge-java-runner ./java
docker build -t judge-cpp-runner  ./cpp

echo "All sandbox images built."