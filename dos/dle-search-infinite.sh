#!/usr/bin/env bash

while true; do
timeout 3600s node dle-search-infinite.js http://dnr24.su/ 4000
sleep 10s
done
