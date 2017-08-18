#!/bin/bash

CMD=${1--}

[[ -z "${CMD}" ]] && echo "USAGE: $0 <cmd to encrypt>" && exit 1

gcloud kms encrypt \
    --location=global  \
    --keyring=cloud-functions \
    --key=accessToken \
    --plaintext-file=${CMD} \
    --ciphertext-file=/dev/stdout | base64