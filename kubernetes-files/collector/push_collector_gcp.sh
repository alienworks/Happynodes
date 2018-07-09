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

INSERT_TAG=xxx
DELETE_TAG=xxx
NODE_P2P_TCP_TAG=xxxx
NODE_P2P_WS_TAG=xxxx

INSERT_TAG_PREVIOUS=xxxx
DELETE_TAG_PREVIOUS=xxxx
NODE_P2P_TCP_TAG_PREVIOUS=xxxx
NODE_P2P_WS_TAG_PREVIOUS=xxxx

# Use gcloud to set the correct cluster for kubectl
echo -e "\e[1m----- Configuring gcloud and kubectl\e[21m"
gcloud container clusters get-credentials $CLUSTER_NAME

# Build and push the neo-insert
echo -e "\e[1m----- Building and pushing neo-insert\e[21m"
# Build container
docker build -t "$INSERT_TAG" "$SCRIPT_DIR/../../../xxx"
docker push "$INSERT_TAG"

# Build and push the neo-delete
echo -e "\e[1m----- Building and pushing neo-delete\e[21m"
# Build container
docker build -t "$DELETE_TAG" "$SCRIPT_DIR/../../../xxxx"
docker push "$DELETE_TAG"

# Build and push the neo-node-p2p-tcp
echo -e "\e[1m----- Building and pushing neo-node-p2p-tcp\e[21m"
# Build container
docker build -t "$NODE_P2P_TCP_TAG" "$SCRIPT_DIR/../../../xxx"
docker push "$NODE_P2P_TCP_TAG"

# Build and push the neo-node-p2p-tcp
echo -e "\e[1m----- Building and pushing neo-node-p2p-ws\e[21m"
# Build container
docker build -t "$NODE_P2P_WS_TAG" "$SCRIPT_DIR/../../../xxxx"
docker push "$NODE_P2P_WS_TAG"

docker rmi $INSERT_TAG_PREVIOUS $DELETE_TAG_PREVIOUS $NODE_P2P_TCP_TAG_PREVIOUS  $NODE_P2P_WS_TAG_PREVIOUS 