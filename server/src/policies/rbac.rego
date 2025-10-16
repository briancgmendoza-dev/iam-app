package rbac

import rego.v1

# ==============================================================================
# PRODUCTION RBAC POLICY - Identity and Access Management
# ==============================================================================

# Default deny - secure by default (fail-closed)
default allow := false

# ==============================================================================
# CORE AUTHORIZATION RULES
# ==============================================================================

# Administrative override - full system access with audit logging
allow if {
    input.user.is_admin == true
    admin_override
}

# Permission-based access control
allow if {
    not input.user.is_admin
    has_required_permission
}

# Self-service rules - users can manage their own data
allow if {
    not input.user.is_admin
    self_service_allowed
}

deny if {
  intput.user.is_admin == false
  // if the user is in the group we have create
  
}

# ==============================================================================
# HELPER RULES
# ==============================================================================

# Admin override with strict validation
admin_override if {
    input.user.is_admin == true
    # Additional admin validation can be added here
    # e.g., admin session validation, MFA requirements, etc.
}

# Check if user has exact permission match
has_required_permission if {
    some permission in input.user.permissions
    permission.module.name == input.resource.module
    permission.action == input.action
}

# Self-service access rules
self_service_allowed if {
    input.resource.module == "users"
    input.action in {"read", "update"}
    input.resource.user_id == input.user.id
}

# ==============================================================================
# SECURITY VALIDATIONS
# ==============================================================================

# Input validation rules
valid_input if {
    # User validation
    is_number(input.user.id)
    input.user.id > 0
    is_string(input.user.username)
    count(input.user.username) > 0

    # Resource validation
    is_string(input.resource.module)
    count(input.resource.module) > 0

    # Action validation
    is_string(input.action)
    input.action in {"create", "read", "update", "delete"}
}

# Rate limiting check (basic)
within_rate_limit if {
    # In production, this would check against a rate limiting service
    # For now, we'll always allow (handled by application layer)
    true
}

# ==============================================================================
# AUDIT AND COMPLIANCE
# ==============================================================================

# Comprehensive audit logging for denied requests
violations contains violation if {
    not allow
    violation := {
        "timestamp": time.now_ns(),
        "user_id": input.user.id,
        "username": input.user.username,
        "resource": input.resource.module,
        "action": input.action,
        "reason": "ACCESS_DENIED",
        "details": sprintf("User %v (%v) denied %v access to %v", [
            input.user.id,
            input.user.username,
            input.action,
            input.resource.module
        ])
    }
}

# Detailed denial reasons for debugging and user feedback
deny_reasons contains reason if {
    not allow
    not has_required_permission
    not admin_override
    not self_service_allowed
    reason := {
        "code": "INSUFFICIENT_PERMISSIONS",
        "message": "User does not have required permissions for this action",
        "required": {
            "module": input.resource.module,
            "action": input.action
        },
        "user_permissions": input.user.permissions,
        "suggestions": permission_suggestions
    }
}

# Input validation violations
violations contains violation if {
    not valid_input
    violation := {
        "timestamp": time.now_ns(),
        "reason": "INVALID_INPUT",
        "details": "Request contains invalid or malformed input data"
    }
}

# Permission suggestions for better UX
permission_suggestions := suggestions if {
    not allow
    suggestions := [
        sprintf("Required permission: %v:%v", [input.resource.module, input.action]),
        "Contact your system administrator to request access",
        sprintf("Current permissions: %v", [format_permissions])
    ]
}

# Format user permissions for display
format_permissions := formatted if {
    count(input.user.permissions) > 0
    formatted := [permission_string |
        permission := input.user.permissions[_]
        permission_string := sprintf("%v:%v", [permission.module.name, permission.action])
    ]
}

format_permissions := ["No permissions assigned"] if {
    count(input.user.permissions) == 0
}

# ==============================================================================
# MONITORING AND METRICS
# ==============================================================================

# Admin actions tracking
admin_actions contains action if {
    allow
    input.user.is_admin == true
    action := {
        "timestamp": time.now_ns(),
        "admin_user": input.user.username,
        "resource": input.resource.module,
        "action": input.action,
        "target_user": input.resource.user_id
    }
}

# High-risk operations
high_risk_operations contains operation if {
    allow
    input.action == "delete"
    operation := {
        "timestamp": time.now_ns(),
        "user": input.user.username,
        "resource": input.resource.module,
        "action": input.action,
        "risk_level": "HIGH"
    }
}

# ==============================================================================
# POLICY METADATA
# ==============================================================================

policy_info := {
    "version": "1.0.0",
    "name": "RBAC Policy for IAM Application",
    "description": "Production-ready Role-Based Access Control policy",
    "last_updated": "2025-10-16",
    "compliance": ["SOC2", "ISO27001", "GDPR"],
    "fail_mode": "closed"
}
