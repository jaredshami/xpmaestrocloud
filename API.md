# XP Maestro Cloud - API Reference

## Authentication

All API requests (except login/register) require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### POST /api/auth/login
Login with email and password to get a JWT token.

**Request:**
```json
{
  "email": "admin@xpmaestrocloud.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@xpmaestrocloud.com"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@xpmaestrocloud.com",
    "password": "admin123"
  }'
```

---

### POST /api/auth/register
Create a new admin account.

**Request:**
```json
{
  "email": "newadmin@xpmaestrocloud.com",
  "password": "secure-password",
  "confirmPassword": "secure-password"
}
```

**Response:**
```json
{
  "message": "Admin created successfully",
  "id": 2
}
```

---

## Clients

### POST /api/clients
Create a new client.

**Request:**
```json
{
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+1-555-0123",
  "company": "Acme Corp"
}
```

**Response:**
```json
{
  "id": 1,
  "customerId": 456789,
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+1-555-0123",
  "company": "Acme Corp",
  "createdAt": "2026-01-09T12:00:00.000Z",
  "updatedAt": "2026-01-09T12:00:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Startup Inc",
    "email": "hello@techstartup.com",
    "phone": "+1-555-9876"
  }'
```

---

### GET /api/clients
Get all clients.

**Response:**
```json
[
  {
    "id": 1,
    "customerId": 456789,
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-555-0123",
    "company": "Acme Corp",
    "createdAt": "2026-01-09T12:00:00.000Z",
    "updatedAt": "2026-01-09T12:00:00.000Z",
    "instances": [
      {
        "id": 1,
        "subdomain": "c456789-i123456-prod.xpmaestrocloud.com",
        "environment": "prod",
        "status": "active"
      }
    ]
  }
]
```

**Example:**
```bash
curl http://localhost:3000/api/clients \
  -H "Authorization: Bearer <token>"
```

---

### GET /api/clients/:id
Get a specific client.

**Response:**
```json
{
  "id": 1,
  "customerId": 456789,
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+1-555-0123",
  "company": "Acme Corp",
  "createdAt": "2026-01-09T12:00:00.000Z",
  "updatedAt": "2026-01-09T12:00:00.000Z",
  "instances": []
}
```

---

### PUT /api/clients/:id
Update a client.

**Request:**
```json
{
  "name": "Acme Corporation Updated",
  "email": "newemail@acme.com"
}
```

---

### DELETE /api/clients/:id
Delete a client (also deletes all associated instances).

---

## Instances

### POST /api/instances
Create a new instance for a client.

**Request:**
```json
{
  "clientId": 1,
  "environment": "prod"
}
```

**Response:**
```json
{
  "id": 1,
  "clientId": 1,
  "customerId": 456789,
  "instanceId": 123456,
  "subdomain": "c456789-i123456-prod.xpmaestrocloud.com",
  "folderPath": "client-456789/prod-123456",
  "environment": "prod",
  "status": "active",
  "createdAt": "2026-01-09T12:00:00.000Z",
  "updatedAt": "2026-01-09T12:00:00.000Z"
}
```

**What happens automatically:**
1. ✅ Generates unique subdomain (c{customerId}-i{instanceId}-{environment}.xpmaestrocloud.com)
2. ✅ Creates folder on VPS: `/var/www/xpmaestrocloud/client-{customerId}/{environment}-{instanceId}/`
3. ✅ Generates Nginx configuration
4. ✅ Deploys Nginx config to VPS
5. ✅ Tests Nginx configuration
6. ✅ Reloads Nginx
7. ✅ Saves to database

**Example:**
```bash
curl -X POST http://localhost:3000/api/instances \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "environment": "prod"
  }'
```

---

### GET /api/instances
Get all instances across all clients.

**Response:**
```json
[
  {
    "id": 1,
    "clientId": 1,
    "customerId": 456789,
    "instanceId": 123456,
    "subdomain": "c456789-i123456-prod.xpmaestrocloud.com",
    "folderPath": "client-456789/prod-123456",
    "environment": "prod",
    "status": "active",
    "createdAt": "2026-01-09T12:00:00.000Z",
    "updatedAt": "2026-01-09T12:00:00.000Z",
    "client": {
      "id": 1,
      "name": "Acme Corporation",
      "customerId": 456789
    }
  }
]
```

---

### GET /api/instances/client/:clientId
Get all instances for a specific client.

**Example:**
```bash
curl http://localhost:3000/api/instances/client/1 \
  -H "Authorization: Bearer <token>"
```

---

### GET /api/instances/:id
Get a specific instance.

---

### DELETE /api/instances/:id
Delete an instance.

**What happens automatically:**
1. ✅ Deletes Nginx configuration from VPS
2. ✅ Reloads Nginx
3. ✅ Removes from database

---

## Dashboard

### GET /api/dashboard/stats
Get dashboard statistics.

**Response:**
```json
{
  "stats": {
    "totalClients": 5,
    "totalInstances": 12,
    "activeInstances": 11
  },
  "recentClients": [
    {
      "id": 5,
      "customerId": 789456,
      "name": "New Client",
      "email": "contact@newclient.com",
      "createdAt": "2026-01-09T10:00:00.000Z"
    }
  ],
  "recentInstances": [
    {
      "id": 12,
      "subdomain": "c789456-i654321-prod.xpmaestrocloud.com",
      "environment": "prod",
      "status": "active",
      "client": {
        "id": 5,
        "name": "New Client"
      }
    }
  ]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message here",
  "statusCode": 400
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (access denied)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Subdomain Format

All instances follow this format:
```
c{customerId}-i{instanceId}-{environment}.xpmaestrocloud.com
```

**Example:**
- `c456789-i123456-prod.xpmaestrocloud.com` - Production
- `c456789-i987654-stage.xpmaestrocloud.com` - Staging
- `c456789-i555555-dev.xpmaestrocloud.com` - Development

---

## Complete Workflow Example

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@xpmaestrocloud.com","password":"admin123"}' \
  | jq -r '.token')

# 2. Create a client
CLIENT=$(curl -s -X POST http://localhost:3000/api/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "email": "contact@mycompany.com",
    "phone": "+1-555-0123"
  }')

CLIENT_ID=$(echo $CLIENT | jq -r '.id')
echo "Created client with ID: $CLIENT_ID"

# 3. Create an instance for the client
INSTANCE=$(curl -s -X POST http://localhost:3000/api/instances \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"clientId\": $CLIENT_ID, \"environment\": \"prod\"}")

SUBDOMAIN=$(echo $INSTANCE | jq -r '.subdomain')
echo "Created instance with subdomain: $SUBDOMAIN"

# 4. Get dashboard stats
curl -s http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN" | jq .
```
