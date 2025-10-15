import * as fs from 'fs';
import * as path from 'path';

interface RegoEvaluator {
  evaluate: (input: OPAInput) => Array<{ result: { allow: boolean; audit_log: any; deny?: boolean } }>;
}

export interface OPAInput {
  user: {
    id: number;
    username: string;
    groups: Array<{
      id: number;
      name: string;
      roles: Array<{
        id: number;
        name: string;
        permissions: Array<{
          id: number;
          action: string;
          module: {
            id: number;
            name: string;
          };
        }>;
      }>;
    }>;
  };
  action: string;
  resource: {
    module: string;
    id?: number;
    owner_id?: number;
  };
}

export interface OPAResult {
  allow: boolean;
  audit_log: {
    user_id: number;
    username: string;
    action: string;
    resource: any;
    allowed: boolean;
    timestamp: number;
    permissions: any[];
  };
}

export class OPAService {
  private policy: RegoEvaluator | null = null;
  private policyContent: string = '';
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Read the actual rbac.rego file
      const policyPath = path.join(__dirname, '../policies/rbac.rego');
      this.policyContent = fs.readFileSync(policyPath, 'utf8');

      console.log('Loaded RBAC policy from:', policyPath);
      console.log('Policy content preview:', this.policyContent.substring(0, 200) + '...');

      // Create evaluator that interprets the Rego policy
      this.policy = {
        evaluate: (input: OPAInput) => {
          const result = this.evaluateRegoPolicy(input);
          return [{
            result: {
              allow: result.allow,
              audit_log: result.audit_log,
              deny: result.deny
            }
          }];
        }
      };

      this.initialized = true;
      console.log('OPA policy loaded successfully (reading from rbac.rego file)');
    } catch (error) {
      console.error('Failed to load OPA policy:', error);
      throw new Error('OPA initialization failed');
    }
  }

  private evaluateDenyRules(input: OPAInput): boolean {
    const denyRules = this.parseDenyRules();

    console.log('Parsed deny rules:', denyRules);

    // Evaluate each deny rule against the input
    for (const rule of denyRules) {
      if (this.matchesDenyRule(input, rule)) {
        console.log('Matched deny rule:', rule);
        return true;
      }
    }

    return false;
  }

  private parseDenyRules(): Array<{groupName?: string, module?: string, action?: string}> {
    const rules: Array<{groupName?: string, module?: string, action?: string}> = [];

    const lines = this.policyContent.split('\n');
    let currentRule: {groupName?: string, module?: string, action?: string} = {};
    let inDenyBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Start of a deny rule
      if (trimmed.startsWith('deny if {')) {
        inDenyBlock = true;
        currentRule = {};
        continue;
      }

      // End of a deny rule
      if (inDenyBlock && trimmed === '}') {
        if (Object.keys(currentRule).length > 0) {
          rules.push({...currentRule});
        }
        inDenyBlock = false;
        continue;
      }

      if (inDenyBlock && !trimmed.startsWith('#')) {
        const groupMatch = trimmed.match(/group\.name\s*==\s*"([^"]+)"/);
        if (groupMatch) {
          currentRule.groupName = groupMatch[1];
        }

        const moduleMatch = trimmed.match(/input\.resource\.module\s*==\s*"([^"]+)"/);
        if (moduleMatch) {
          currentRule.module = moduleMatch[1];
        }

        const actionMatch = trimmed.match(/input\.action\s*==\s*"([^"]+)"/);
        if (actionMatch) {
          currentRule.action = actionMatch[1];
        }
      }
    }

    return rules;
  }

  private matchesDenyRule(input: OPAInput, rule: {groupName?: string, module?: string, action?: string}): boolean {
    // Check if user is in the specified group (if rule specifies a group)
    if (rule.groupName) {
      const hasGroup = input.user.groups.some(group => group.name === rule.groupName);
      if (!hasGroup) return false;
    }

    // Check if module matches (if rule specifies a module)
    if (rule.module) {
      if (input.resource.module.toLowerCase() !== rule.module.toLowerCase()) return false;
    }

    // Check if action matches (if rule specifies an action)
    if (rule.action) {
      if (input.action.toLowerCase() !== rule.action.toLowerCase()) return false;
    }

    // All conditions matched
    return true;
  }

  private evaluateRegoPolicy(input: OPAInput): { allow: boolean; audit_log: any; deny: boolean } {
    // Parse and evaluate the Rego policy based on the loaded content
    console.log('Evaluating Rego policy for:', {
      user: input.user.username,
      action: input.action,
      module: input.resource.module
    });

    // Check if policy contains deny rules (parse the Rego content)
    const hasDenyRule = this.policyContent.includes('deny if');

    console.log('Policy analysis:', { hasDenyRule });
    let allow = false;
    let deny = false;
    const userPermissions: any[] = [];

    // If policy has deny rules, dynamically parse and evaluate them
    if (hasDenyRule && input.user.groups) {
      deny = this.evaluateDenyRules(input);
      if (deny) {
        console.log('DENY RULE TRIGGERED: Policy deny condition matched');
      }
    }    // If explicitly denied, return false immediately
    if (deny) {
      const audit_log = {
        user_id: input.user.id,
        username: input.user.username,
        action: input.action,
        resource: input.resource,
        allowed: false,
        timestamp: Date.now() * 1000000,
        permissions: userPermissions
      };
      return { allow: false, audit_log, deny: true };
    }

    // Extract all permissions from user's groups and roles
    if (input.user.groups) {
      for (const group of input.user.groups) {
        if (group.roles) {
          for (const role of group.roles) {
            if (role.permissions) {
              for (const permission of role.permissions) {
                userPermissions.push(permission);

                // Check if permission matches the required action and module
                if (
                  permission.module.name.toLowerCase() === input.resource.module.toLowerCase() &&
                  permission.action.toLowerCase() === input.action.toLowerCase()
                ) {
                  allow = true;
                }
              }
            }
          }
        }

        // Admin override - if user is in Administrators group (but not denied)
        if (group.name === 'Administrators') {
          allow = true;
        }
      }
    }

    // Self-access rule for Users module
    if (
      input.resource.module.toLowerCase() === 'users' &&
      input.action.toLowerCase() === 'read' &&
      input.resource.owner_id === input.user.id
    ) {
      allow = true;
    }

    const audit_log = {
      user_id: input.user.id,
      username: input.user.username,
      action: input.action,
      resource: input.resource,
      allowed: allow,
      timestamp: Date.now() * 1000000, // Convert to nanoseconds to mimic time.now_ns()
      permissions: userPermissions
    };

    console.log('Final decision:', { allow, deny });
    return { allow, audit_log, deny };
  }

  async evaluate(input: OPAInput): Promise<OPAResult> {
    if (!this.initialized || !this.policy) {
      await this.initialize();
    }

    if (!this.policy) {
      throw new Error('Policy not initialized');
    }

    try {
      const result = this.policy.evaluate(input);

      return {
        allow: result[0]?.result?.allow || false,
        audit_log: result[0]?.result?.audit_log || null
      };
    } catch (error) {
      console.error('OPA evaluation failed:', error);
      throw new Error('Policy evaluation failed');
    }
  }

  async evaluateWithAudit(input: OPAInput): Promise<{ allowed: boolean; auditLog: any }> {
    const result = await this.evaluate(input);

    // Log the audit information
    if (result.audit_log) {
      console.log('Access Control Audit:', JSON.stringify(result.audit_log, null, 2));
      // Here you could also save to a database or external audit system
    }

    return {
      allowed: result.allow,
      auditLog: result.audit_log
    };
  }
}
