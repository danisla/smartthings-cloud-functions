#!/bin/bash

DEST=${DEST:-cloud_function/commands.json}

echo "{}" | jq '.on_cmd="'$(./encrypt_cmd.sh on_cmd.txt)'" | .off_cmd="'$(./encrypt_cmd.sh off_cmd.txt)'"' > "${DEST}"

echo "Wrote ${DEST}"