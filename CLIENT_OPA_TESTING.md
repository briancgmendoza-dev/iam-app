# Client-Side OPA Testing Guide

This guide explains how to test the Open Policy Agent (OPA) integration from the client-side application.

## 🚀 Getting Started

### Prerequisites
1. **Server running**: Make sure the server is running with OPA integration
   ```bash
   cd server
   npm run dev
   ```

2. **Client running**: Start the React client application
   ```bash
   cd client
   npm run dev
   ```

3. **Access the application**: Open http://localhost:5173 in your browser

## 🔐 Authentication

First, log in to the application:
- **Username**: `admin`
- **Password**: `admin123`

This will give you administrator privileges to test all OPA features.

## 🧪 Testing Methods

### 1. Dashboard OPA Testing Component

The dashboard includes a comprehensive OPA testing component with three tabs:

#### **Test Tab**
- **Purpose**: Interactive permission testing
- **Features**:
  - Module selection (Users, Groups, Roles, Modules, Permissions, System)
  - Action selection (create, read, update, delete)
  - Optional Resource ID input
  - Real-time OPA decision feedback

#### **Health Tab**
- **Purpose**: Check OPA service health
- **Features**:
  - Health status indicator
  - Timestamp of last check
  - Error reporting if OPA is down

#### **Examples Tab**
- **Purpose**: Quick testing with predefined scenarios
- **Features**:
  - Pre-configured test cases
  - One-click testing
  - Common permission scenarios

### 2. Navigation Menu Access Control

Test OPA by navigating through the application:

1. **Users Page** (`/users`)
   - Requires "read" permission on "Users" module
   - Admin should have access ✅
   - Regular users may be restricted ❌

2. **Groups Page** (`/groups`)
   - Requires "read" permission on "Groups" module
   - Test creating/editing groups

3. **Roles Page** (`/roles`)
   - Requires "read" permission on "Roles" module
   - Test role management

4. **Modules Page** (`/modules`)
   - Requires "read" permission on "Modules" module

5. **Permissions Page** (`/permissions`)
   - Requires "read" permission on "Permissions" module

### 3. API Testing with Browser DevTools

Open browser DevTools (F12) and monitor the Network tab:

1. **Watch API Calls**: See OPA middleware intercepting requests
2. **Check Response Codes**:
   - `200`: Permission granted ✅
   - `403`: Permission denied ❌
   - `500`: OPA evaluation error ⚠️

### 4. Manual API Testing

Use the browser console or Postman:

```javascript
// Test direct API calls (requires JWT token)
fetch('http://localhost:8080/users', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(response => console.log('Status:', response.status))
.catch(error => console.error('Error:', error));
```

## 📊 Test Scenarios

### Scenario 1: Admin User Testing
**Expected**: All permissions granted ✅

```javascript
// Test cases for admin user
const adminTests = [
  { module: 'Users', action: 'create' },    // ✅ Should pass
  { module: 'Groups', action: 'delete' },   // ✅ Should pass
  { module: 'Roles', action: 'update' },    // ✅ Should pass
  { module: 'System', action: 'read' },     // ✅ Should pass
];
```

### Scenario 2: Regular User Testing
**Expected**: Limited permissions (read-only for most modules)

Create a regular user account and test:
- Users module: read ✅, create/update/delete ❌
- Groups module: read ✅, write operations ❌
- Other modules: read-only access

### Scenario 3: Invalid Permission Testing
**Expected**: Access denied ❌

```javascript
const invalidTests = [
  { module: 'InvalidModule', action: 'read' },     // ❌ Should fail
  { module: 'Users', action: 'invalid_action' },   // ❌ Should fail
];
```

### Scenario 4: OPA Health Monitoring
**Expected**: Service status reporting

- Click "Check OPA Health" button
- Should return: `"OPA is healthy"`
- Monitor for any service interruptions

## 🔍 Monitoring OPA in Action

### Server-Side Logs
Watch the server console for OPA audit logs:

```
Access Control Audit: {
  "user_id": 1,
  "username": "admin",
  "action": "read",
  "resource": {"module": "Users"},
  "allowed": true,
  "timestamp": 1760533269015000000,
  "permissions": [...]
}
```

### Client-Side Feedback
- **Green indicators**: Permission granted ✅
- **Red indicators**: Permission denied ❌
- **Error messages**: System issues ⚠️

## 🐛 Troubleshooting

### Common Issues:

1. **403 Forbidden Errors**
   - **Cause**: User lacks required permission
   - **Solution**: Check user's groups and roles
   - **Test**: Use admin account to verify OPA is working

2. **500 Internal Server Error**
   - **Cause**: OPA service failure
   - **Solution**: Check server logs for OPA initialization errors
   - **Test**: Use health check endpoint

3. **Network Errors**
   - **Cause**: Server not running or connection issues
   - **Solution**: Verify server is running on port 8080
   - **Test**: Check `http://localhost:8080/opa/health`

4. **Token Expiration**
   - **Cause**: JWT token expired
   - **Solution**: Log in again to get fresh token
   - **Test**: Check browser localStorage for valid token

## 📱 UI Features for OPA Testing

### Real-Time Permission Feedback
- **Dashboard permissions display**: Shows user's current permissions
- **Navigation menu**: Menu items appear/disappear based on permissions
- **Button states**: Create/Edit/Delete buttons enabled/disabled by permissions
- **Error messages**: Clear feedback when access is denied

### Permission Simulation
Use the "Simulate Action" feature on the dashboard:
1. Enter module name (e.g., "Users")
2. Enter action (e.g., "create")
3. Click "Test Permission"
4. See real-time OPA decision

### Audit Trail Visibility
- Server console shows detailed audit logs
- Client receives success/failure feedback
- Network tab shows HTTP status codes

## 🎯 Testing Checklist

### ✅ Basic Functionality
- [ ] Login works and JWT token is stored
- [ ] Dashboard loads and shows user permissions
- [ ] OPA health check responds correctly
- [ ] Navigation menu reflects user permissions

### ✅ Permission Testing
- [ ] Admin user can access all modules
- [ ] Regular user has limited access
- [ ] Invalid permissions are denied
- [ ] Self-access rules work (users can read own data)

### ✅ Error Handling
- [ ] 403 errors show appropriate messages
- [ ] Network errors are handled gracefully
- [ ] OPA service failures are detected
- [ ] Token expiration redirects to login

### ✅ Real-Time Features
- [ ] Permission simulation works
- [ ] Health checks update status
- [ ] Audit logs appear in server console
- [ ] UI updates based on permission changes

## 🔧 Advanced Testing

### Custom Test Scenarios
Create your own test users with different permission combinations:

1. **Read-Only User**: Only read permissions
2. **Module-Specific User**: Access to specific modules only
3. **Action-Limited User**: Can read but not modify
4. **Department User**: Access to department-specific resources

### Integration Testing
Test the full flow:
1. Login → 2. Navigate → 3. Perform Action → 4. Check Audit Log → 5. Verify Result

This comprehensive testing ensures your OPA integration works correctly across all user scenarios and edge cases.
