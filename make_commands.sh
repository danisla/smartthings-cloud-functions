#!/bin/bash

DEST=${DEST:-cloud_function/commands.json}

[[ $# -eq 0 ]] && echo "USAGE: $0 <cmd name>=<cmd file> [<cmd name>=<cmd file> ...]" && exit 1

JSON="{}"
for arg in $@; do
    IFS='=' read -a kv <<< "$arg"
    [[ ${#kv[@]} -ne 2 ]] && echo "ERROR: Invalid key=value pair: $arg" && break
    [[ ! -e "${kv[1]}" ]] && echo "ERROR: File not found: ${kv[1]}" && break
    JSON=$(echo "${JSON}" | jq -r '.'${kv[0]}'="'$(./encrypt_cmd.sh ${kv[1]})'"')
done

echo "${JSON}" | jq -r . > ${DEST}

echo "INFO: Wrote $# commands to ${DEST}"