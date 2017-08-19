#!/bin/bash

FN=${1:-"cmdExec"}
REGION="us-central1"

SCRIPT_PATH=$(dirname $0)
COMMANDS_FILE="${SCRIPT_PATH}/commands.json"

[[ ! -e "${COMMANDS_FILE}" ]] && echo "ERROR: Command file not found: ${COMMANDS_FILE}" && exit 1

[[ "$(jq -r '.|keys|length' ${COMMANDS_FILE})" -lt 1 ]] && echo "ERROR: No commands found in ${COMMANDS_FILE}" && exit 1

echo "INFO: Deploying Cloud Function to region ${REGION} from local source: ${FN}"

pushd $SCRIPT_PATH >/dev/null
gcloud beta functions deploy ${FN} --trigger-http --stage-bucket gs://$(gcloud config get-value project)-cloud-functions --region ${REGION}
popd >/dev/null