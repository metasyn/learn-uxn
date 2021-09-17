#!/usr/bin/env bash
if [[ -z ${TOKEN} ]]; then
    echo 'TOKEN must be defined';
    exit 1;
fi

MANIFEST=$(cat .build.yml);

curl \
    --request POST \
    -H Authorization:"token ${TOKEN}" \
    --data-urlencode \
    "manifest=${MANIFEST}" \
    https://builds.sr.ht/api/jobs
