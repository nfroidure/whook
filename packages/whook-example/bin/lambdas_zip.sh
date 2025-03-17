#!/bin/bash
set -e -o pipefail -u

APP_ENV=${APP_ENV:-local}
FILES=$(ls "builds/$APP_ENV")

rm -rf "lambdas/$APP_ENV"
mkdir -p "lambdas/$APP_ENV"

for f in $FILES
do
  echo "Processing $f file..."
  zip -jr "lambdas/$APP_ENV/$f.zip" builds/$APP_ENV/$f/*
  openssl dgst -sha256 -binary "lambdas/$APP_ENV/$f.zip" | openssl enc -base64 | tr -d "\n" > "lambdas/$APP_ENV/$f.zip.base64sha256"
done
