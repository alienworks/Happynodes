#!/bin/bash

set -ex

# Set working dir to script location
cd "${0%/*}"
SCRIPT_DIR=$(pwd)

COMPUTE_REGION=xxxx
COMPUTE_ZONE=xxx
CLUSTER_NAME=xxx
PROJECT_NAME=xxxx

# Set environment variables for gcloud
export CLOUDSDK_COMPUTE_REGION="$COMPUTE_REGION"
export CLOUDSDK_COMPUTE_ZONE="$COMPUTE_ZONE"
export CLOUDSDK_CORE_PROJECT="$PROJECT_NAME"

gcloud config set project $PROJECT_NAME

VERSION=4
PREVIOUS_VERSION=$((VERSION-1))

REDIS_NETWORK_SUMMARY_TAG=XXXX
REDIS_NODES_INFO_TAG=XXXX
REDIS_PEERS_INFO_TAG=XXXX
REDIS_UNCONFIRMEDTX_INFO_TAG=XXXXX

REDIS_NETWORK_SUMMARY_TAG_PREVIOUS=XXXX
REDIS_NODES_INFO_TAG_PREVIOUS=XXXX
REDIS_PEERS_INFO_TAG_PREVIOUS=XXXXX
REDIS_UNCONFIRMEDTX_INFO_TAG_PREVIOUS=XXXX

# Use gcloud to set the correct cluster for kubectl
echo -e "\e[1m----- Configuring gcloud and kubectl\e[21m"
gcloud container clusters get-credentials $CLUSTER_NAME

# Build and push the redis-network-summary
echo -e "\e[1m----- Building and pushing redis-network-summary\e[21m"
# Build container
docker build -t "$REDIS_NETWORK_SUMMARY_TAG"  "$SCRIPT_DIR/../../../xxxx/"
docker push "$REDIS_NETWORK_SUMMARY_TAG"

# Build and push the redis-nodes-info
echo -e "\e[1m----- Building and pushing redis-nodes-info\e[21m"
# Build container
docker build -t "$REDIS_NODES_INFO_TAG" "$SCRIPT_DIR/../../../xxxx"
docker push "$REDIS_NODES_INFO_TAG"

# Build and push the redis-peers-info
echo -e "\e[1m----- Building and pushing redis-peers-info\e[21m"
# Build container
docker build -t "$REDIS_PEERS_INFO_TAG" "$SCRIPT_DIR/../../../xxxx"
docker push "$REDIS_PEERS_INFO_TAG"

# Build and push the redis-unconfirmedtx-info
echo -e "\e[1m----- Building and pushing redis-unconfirmedtx-info\e[21m"
# Build container
docker build -t "$REDIS_UNCONFIRMEDTX_INFO_TAG" "$SCRIPT_DIR/../../../xxxx"
docker push "$REDIS_UNCONFIRMEDTX_INFO_TAG"

docker rmi $REDIS_NETWORK_SUMMARY_TAG_PREVIOUS $REDIS_NODES_INFO_TAG_PREVIOUS  $REDIS_PEERS_INFO_TAG_PREVIOUS $REDIS_UNCONFIRMEDTX_INFO_TAG_PREVIOUS