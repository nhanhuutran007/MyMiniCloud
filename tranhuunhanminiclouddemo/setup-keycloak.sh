#!/bin/bash

# Script to robustly wait for Keycloak and apply configuration
# This solves the "Container is restarting" issue by waiting for stability.

CONTAINER_NAME="authentication-identity-server"
KC_PORT=8081
MAX_RETRIES=40
SLEEP_INTERVAL=5

echo "----------------------------------------------------------"
echo "Starting Keycloak Readiness Check & Configuration"
echo "----------------------------------------------------------"

# 1. Wait for container to be in 'running' state
echo "Step 1: Checking if container [$CONTAINER_NAME] is running..."
until [ "$(sudo docker inspect -f '{{.State.Running}}' $CONTAINER_NAME 2>/dev/null)" == "true" ]; do
    echo ">>> Container is starting or restarting... waiting $SLEEP_INTERVAL seconds."
    sleep $SLEEP_INTERVAL
done
echo ">>> Container is RUNNING."

# 2. Wait for Keycloak service to respond
echo "Step 2: Waiting for Keycloak service to respond on port $KC_PORT..."
count=0
until curl -s -f http://localhost:$KC_PORT/ > /dev/null; do
    count=$((count + 1))
    if [ $count -ge $MAX_RETRIES ]; then
        echo "!!! ERROR: Keycloak failed to respond after $((MAX_RETRIES * SLEEP_INTERVAL)) seconds."
        echo "Showing last 20 lines of logs:"
        sudo docker logs $CONTAINER_NAME | tail -n 20
        exit 1
    fi
    echo ">>> Keycloak is still initializing... ($count/$MAX_RETRIES)"
    sleep $SLEEP_INTERVAL
done
echo ">>> Keycloak is UP and RESPONDING."

# 3. Execute configuration commands
echo "Step 3: Applying configuration via kcadm.sh..."

# Wait a few more seconds for the admin API to stabilize
sleep 5

sudo docker exec $CONTAINER_NAME /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://localhost:8080 \
    --realm master \
    --user admin \
    --password admin

if [ $? -eq 0 ]; then
    echo ">>> Authentication successful."
else
    echo "!!! ERROR: Failed to authenticate with kcadm.sh"
    exit 1
fi

sudo docker exec $CONTAINER_NAME /opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=none
sudo docker exec $CONTAINER_NAME /opt/keycloak/bin/kcadm.sh update realms/TranHuuNhan_52300235 -s sslRequired=none

echo "----------------------------------------------------------"
echo "✅ Configuration completed successfully!"
echo "----------------------------------------------------------"
