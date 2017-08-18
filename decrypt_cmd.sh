#!/bin/bash

ENC=${1--}

[[ -z "${ENC}" ]] && echo "USAGE: $0 <cmd to decrypt>" && exit 1

gcloud kms decrypt \
    --location=global \
    --keyring=cloud-functions \
    --key=accessToken \
    --ciphertext-file=<(cat -- ${ENC} | base64 -D) \
    --plaintext-file=/dev/stdout