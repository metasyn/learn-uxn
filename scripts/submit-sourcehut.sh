#!/usr/bin/env bash
BASE=$(dirname "$0")

pushd ${BASE}/..

if [[ -f ".env" ]]; then
    source .env
fi;

if [[ -z ${TOKEN} ]]; then
    echo 'TOKEN must be defined';
    exit 1;
fi

if [[ -f ".build.yml" ]]; then
    MANIFEST=$(cat .build.yml);
else
    echo ".build.yml file doesn't exist."
    exit 1;
fi

curl \
    --request POST \
    -H Authorization:"token ${TOKEN}" \
    --data-urlencode \
    "manifest=${MANIFEST}&tags=learn-uxn&note=scheduled build" \
    https://builds.sr.ht/api/jobs
