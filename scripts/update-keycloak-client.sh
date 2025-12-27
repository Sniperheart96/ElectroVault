#!/bin/bash
# Update Keycloak Client with network IP

KEYCLOAK_URL="http://localhost:8080"
SERVER_IP="192.168.178.80"

# Get admin token
TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get admin token"
  exit 1
fi

echo "Got admin token"

# Get client ID
CLIENT_UUID=$(curl -s \
  -H "Authorization: Bearer $TOKEN" \
  "$KEYCLOAK_URL/admin/realms/electrovault/clients?clientId=electrovault-web" \
  | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Client UUID: $CLIENT_UUID"

# Update client
curl -s -X PUT "$KEYCLOAK_URL/admin/realms/electrovault/clients/$CLIENT_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "electrovault-web",
    "name": "ElectroVault Web",
    "enabled": true,
    "publicClient": true,
    "standardFlowEnabled": true,
    "directAccessGrantsEnabled": true,
    "redirectUris": [
      "http://localhost:3000/*",
      "http://'"$SERVER_IP"':3000/*",
      "http://ITME-SERVER:3000/*"
    ],
    "webOrigins": [
      "http://localhost:3000",
      "http://'"$SERVER_IP"':3000",
      "http://ITME-SERVER:3000"
    ],
    "protocol": "openid-connect"
  }'

echo ""
echo "Client updated with redirect URLs for $SERVER_IP"
