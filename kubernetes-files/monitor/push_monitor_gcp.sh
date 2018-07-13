#!/bin/bash

set -ex

# Set working dir to script location
cd "${0%/*}"
SCRIPT_DIR=$(pwd)

COMPUTE_REGION=xxx
COMPUTE_ZONE=xxx
CLUSTER_NAME=xxx
PROJECT_NAME=xxx

# Set environment variables for gcloud
export CLOUDSDK_COMPUTE_REGION="$COMPUTE_REGION"
export CLOUDSDK_COMPUTE_ZONE="$COMPUTE_ZONE"
export CLOUDSDK_CORE_PROJECT="$PROJECT_NAME"

gcloud config set project $PROJECT_NAME

VERSION=1
PREVIOUS_VERSION=$((VERSION-1))

BACK_TAG=xxxx
FRONT_TAG=xxxx

BACK_TAG_PREVIOUS=xxxx
FRONT_TAG_PREVIOUS=xxxx

# Use gcloud to set the correct cluster for kubectl
echo -e "\e[1m----- Configuring gcloud and kubectl\e[21m"
gcloud container clusters get-credentials $CLUSTER_NAME

# Build and push the backened
echo -e "\e[1m----- Building and pushing back\e[21m"
# Bundle source
cd "$SCRIPT_DIR/../../../Happynodes/neo-back/"
# npm install
cd "$SCRIPT_DIR"
docker build -t "$BACK_TAG" "$SCRIPT_DIR/../../../xxxxx"
docker push "$BACK_TAG"

# Build and push the frontend
echo -e "\e[1m----- Building and pushing front\e[21m"
# Bundle source
cd "$SCRIPT_DIR/../../../Happynodes/neo-interface/"
# npm install
cd "$SCRIPT_DIR"
# Build container
docker build -t "$FRONT_TAG" "$SCRIPT_DIR/../../../xxxx"
docker push "$FRONT_TAG"

docker rmi $BACK_TAG_PREVIOUS $FRONT_TAG_PREVIOUS 