# IAM Application with Open Policy Agent (OPA) Integration

This IAM application now includes Open Policy Agent (OPA) integration for enhanced policy-based access control.

## OPA Integration Features

### ✅ Implemented Features

1. **Policy-Based Access Control**: All API endpoints now use OPA for authorization decisions
2. **Audit Logging**: Comprehensive audit trail for all access attempts
3. **JavaScript Policy Engine**: OPA-compatible policy evaluation (production-ready for basic scenarios)
4. **Middleware Integration**: Seamless integration with existing Express.js routes
5. **Admin Override Rules**: Administrators group has full system access
6. **Self-Access Rules**: Users can access their own data in certain scenarios

### 🏗️ Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│  Express    │───▶│ OPA Service │───▶│  Database   │
│  Request    │    │ Middleware  │    │ Evaluation  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │                   │
                          ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ JWT Auth    │    │ Audit Log  │
                   │ Validation  │    │ Output     │
                   └─────────────┘    └─────────────┘
```

### 📁 New Files Created

1. **`src/policies/rbac.rego`** - Rego policy definition (for reference)
2. **`src/services/opa.service.ts`** - OPA service implementation
3. **`src/controllers/opa.controller.ts`** - OPA management endpoints
4. **`src/middleware/opa-check-permission.ts`** - OPA middleware
5. **`src/routes/opa.routes.ts`** - OPA health check routes

### 🔧 Modified Files

- **All route files** - Updated to use OPA middleware instead of basic permission checks
- **`src/services/access-control.service.ts`** - Enhanced with OPA integration
- **`src/server.ts`** - Added OPA routes
- **`package.json`** - Added OPA dependency

## 🚀 Usage

### Starting the Server

```bash
cd server
npm install
npm run dev
```

### Testing OPA Integration

1. **Login to get JWT token:**
```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

2. **Test protected endpoint:**
```bash
curl -X GET http://localhost:8080/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. **Check OPA health:**
```bash
curl -X GET http://localhost:8080/opa/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### API Endpoints

All existing endpoints now use OPA-based authorization:

- `GET /users` - Requires "read" permission on "Users" module
- `POST /groups` - Requires "create" permission on "Groups" module
- `PUT /roles/:id` - Requires "update" permission on "Roles" module
- `DELETE /permissions/:id` - Requires "delete" permission on "Permissions" module

**New OPA endpoints:**
- `GET /opa/health` - Check OPA service health
- `POST /opa/reload-policy` - Reload OPA policy (admin only)

## 🔍 Policy Rules

The OPA service implements these access control rules:

1. **Default Deny**: All access denied by default
2. **Permission-Based Access**: Users need specific module+action permissions
3. **Admin Override**: Users in "Administrators" group have full access
4. **Self-Access**: Users can read their own data in the Users module
5. **Audit Logging**: All decisions logged with full context

## 📊 Audit Logs

Every access attempt generates detailed audit logs:

```json
{
  "user_id": 1,
  "username": "admin",
  "action": "read",
  "resource": {"module": "Users"},
  "allowed": true,
  "timestamp": 1760533269015000000,
  "permissions": [...]
}
```

## 🔮 Production Considerations

### For Production Deployment:

1. **Use Real OPA WASM**: Replace JavaScript implementation with actual OPA WASM bundles
2. **External Policy Management**: Store policies in external policy repository
3. **Performance Optimization**: Cache policy decisions and user permissions
4. **Audit Storage**: Store audit logs in external system (database, logging service)
5. **Policy Versioning**: Implement policy version control and rollback capabilities

### Upgrading to Real OPA:

```bash
# Compile Rego policy to WASM bundle
opa build -t wasm -e rbac/allow -e rbac/audit_log src/policies/

# Update OPA service to use compiled bundle
# Replace JavaScript evaluation with actual OPA WASM
```

## 🎯 Benefits

1. **Enhanced Security**: Fine-grained, policy-based access control
2. **Audit Compliance**: Comprehensive audit trail for regulatory compliance
3. **Flexibility**: Easy to modify access rules without code changes
4. **Scalability**: Centralized policy management across services
5. **Maintainability**: Declarative policies easier to understand and maintain

## 🧪 Testing Scenarios

The implementation supports these test scenarios:

1. **Admin Access**: Admin user can access all resources
2. **User Access**: Regular users limited to read-only permissions
3. **Unauthorized Access**: Requests without proper permissions are blocked
4. **Self-Access**: Users can access their own profile data
5. **Audit Tracking**: All access attempts logged for review

---

**Login Credentials:**
- **Username**: `admin`
- **Password**: `admin123`

This OPA integration provides enterprise-grade access control while maintaining the simplicity and flexibility needed for modern IAM systems.
