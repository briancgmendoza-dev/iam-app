package rbac

import rego.v1

# Default deny
default allow := false

# Explicit deny rule: Administrators cannot delete users (commented out)
# deny if {
#     some group in input.user.groups
#     group.name == "Administrators"
#     input.resource.module == "Users"
#     input.action == "delete"
# }

# New deny rule: Administrators cannot create or update users
# deny if {
#    some group in input.user.groups
#    group.name == "Administrators"
#    input.resource.module == "Users"
#    input.action == "create"
# }

# deny if {
#    some group in input.user.groups
#    group.name == "Administrators"
#    input.resource.module == "Users"
#    input.action == "update"
# }

# deny if {
#    some group in input.user.groups
#    group.name == "Administrators"
#    input.resource.module == "Roles"
#    input.action == "update"
# }

# Allow if user has required permission through their groups and roles
allow if {
    not deny  # Only allow if not explicitly denied
    user_permissions[_] == required_permission
}

# Get all permissions for a user through their groups and roles
user_permissions contains permission if {
    some group in input.user.groups
    some role in group.roles
    some permission in role.permissions
    permission.module.name == input.resource.module
    permission.action == input.action
}

# Helper to construct required permission
required_permission := {
    "module": {"name": input.resource.module},
    "action": input.action
}

# Additional rules for admin override
allow if {
    not deny  # Only allow if not explicitly denied
    some group in input.user.groups
    group.name == "Administrators"
}

# Specific module-based rules
allow if {
    not deny  # Only allow if not explicitly denied
    input.resource.module == "Users"
    input.action == "read"
    input.user.id == input.resource.owner_id  # Users can read their own data
}

# Audit logging decision
audit_log := {
    "user_id": input.user.id,
    "username": input.user.username,
    "action": input.action,
    "resource": input.resource,
    "allowed": allow,
    "timestamp": time.now_ns(),
    "permissions": user_permissions
}
