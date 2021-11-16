#!/usr/bin/env bash
echo "Starting python server..."
nohup python3 -m http.server &
pid=$!
npx cypress run
echo "Killing python server..."
kill $pid
