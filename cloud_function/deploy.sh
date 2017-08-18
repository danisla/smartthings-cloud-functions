#!/bin/bash

FN="stFn1"
REGION="us-central1"

echo "INFO: Deploying Cloud Function to region ${REGION} from local source: ${FN}"
gcloud beta functions deploy ${FN} --trigger-http --stage-bucket gs://$(gcloud config get-value project)-cloud-functions --region ${REGION}