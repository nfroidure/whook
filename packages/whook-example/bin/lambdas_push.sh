#!/bin/bash
set -e -o pipefail -u

echo "Sending Signatures..."
aws s3 cp \
 --content-type text/plain --recursive \
 --exclude "*.zip" --include "*.base64sha256" \
  lambdas/$APP_ENV s3://project-lambdas-release-$APP_ENV/;

echo "Sending ZIP files..."
aws s3 cp --recursive --exclude "*.base64sha256" \
  --include "*.zip" lambdas/$APP_ENV \
  s3://project-lambdas-release-$APP_ENV/
