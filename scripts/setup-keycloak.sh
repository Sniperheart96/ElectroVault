#!/bin/bash
# Keycloak Setup Script for ElectroVault
# Run this after Keycloak is started

KEYCLOAK_URL="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin123"
REALM_NAME="electrovault"
CLIENT_ID="electrovault-web"

# Get admin token
echo "Getting admin token..."
TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli" \
  -d "username=$ADMIN_USER" \
  -d "password=$ADMIN_PASSWORD" \
  -d "grant_type=password" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get admin token"
  exit 1
fi

echo "Admin token obtained successfully"

# Check if realm exists
echo "Checking if realm exists..."
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$KEYCLOAK_URL/admin/realms/$REALM_NAME")

if [ "$REALM_EXISTS" = "200" ]; then
  echo "Realm '$REALM_NAME' already exists"
else
  # Create realm
  echo "Creating realm '$REALM_NAME'..."
  curl -s -X POST "$KEYCLOAK_URL/admin/realms" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "realm": "'"$REALM_NAME"'",
      "enabled": true,
      "displayName": "ElectroVault",
      "registrationAllowed": false,
      "resetPasswordAllowed": true,
      "editUsernameAllowed": false,
      "bruteForceProtected": true
    }'
  echo "Realm created"
fi

# Check if client exists
echo "Checking if client exists..."
CLIENT_EXISTS=$(curl -s \
  -H "Authorization: Bearer $TOKEN" \
  "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients?clientId=$CLIENT_ID" | grep -o '"id"')

if [ -n "$CLIENT_EXISTS" ]; then
  echo "Client '$CLIENT_ID' already exists"
else
  # Create client
  echo "Creating client '$CLIENT_ID'..."
  curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "clientId": "'"$CLIENT_ID"'",
      "name": "ElectroVault Web",
      "enabled": true,
      "publicClient": true,
      "standardFlowEnabled": true,
      "directAccessGrantsEnabled": true,
      "redirectUris": [
        "http://localhost:3000/*",
        "http://ITME-SERVER:3000/*"
      ],
      "webOrigins": [
        "http://localhost:3000",
        "http://ITME-SERVER:3000"
      ],
      "protocol": "openid-connect"
    }'
  echo "Client created"
fi

# Create roles
echo "Creating roles..."
for ROLE in admin moderator contributor viewer; do
  curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name": "'"$ROLE"'"}'
done
echo "Roles created"

# Create test user
echo "Creating test user..."
USER_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@electrovault.local",
    "firstName": "Test",
    "lastName": "User",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{
      "type": "password",
      "value": "test123",
      "temporary": false
    }]
  }' -w "%{http_code}" -o /dev/null)

if [ "$USER_RESPONSE" = "201" ] || [ "$USER_RESPONSE" = "409" ]; then
  echo "Test user created or already exists"

  # Get user ID and assign roles
  USER_ID=$(curl -s \
    -H "Authorization: Bearer $TOKEN" \
    "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users?username=testuser" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

  if [ -n "$USER_ID" ]; then
    # Get contributor role ID
    ROLE_ID=$(curl -s \
      -H "Authorization: Bearer $TOKEN" \
      "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles/contributor" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

    if [ -n "$ROLE_ID" ]; then
      # Assign role
      curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users/$USER_ID/role-mappings/realm" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '[{"id": "'"$ROLE_ID"'", "name": "contributor"}]'
      echo "Contributor role assigned to test user"
    fi
  fi
fi

# Create admin user
echo "Creating admin user..."
ADMIN_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "evadmin",
    "email": "admin@electrovault.local",
    "firstName": "Admin",
    "lastName": "User",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{
      "type": "password",
      "value": "admin123",
      "temporary": false
    }]
  }' -w "%{http_code}" -o /dev/null)

if [ "$ADMIN_RESPONSE" = "201" ] || [ "$ADMIN_RESPONSE" = "409" ]; then
  echo "Admin user created or already exists"

  # Get user ID and assign admin role
  ADMIN_UID=$(curl -s \
    -H "Authorization: Bearer $TOKEN" \
    "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users?username=evadmin" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

  if [ -n "$ADMIN_UID" ]; then
    ADMIN_ROLE_ID=$(curl -s \
      -H "Authorization: Bearer $TOKEN" \
      "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles/admin" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

    if [ -n "$ADMIN_ROLE_ID" ]; then
      curl -s -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users/$ADMIN_UID/role-mappings/realm" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '[{"id": "'"$ADMIN_ROLE_ID"'", "name": "admin"}]'
      echo "Admin role assigned to admin user"
    fi
  fi
fi

echo ""
echo "=========================================="
echo "Keycloak Setup Complete!"
echo "=========================================="
echo ""
echo "Realm: $REALM_NAME"
echo "Client: $CLIENT_ID"
echo ""
echo "Test Users:"
echo "  - testuser / test123 (contributor role)"
echo "  - evadmin / admin123 (admin role)"
echo ""
echo "Keycloak Admin Console: $KEYCLOAK_URL/admin"
echo "=========================================="
