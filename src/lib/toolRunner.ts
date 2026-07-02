import { ToolModule } from "../types";

/**
 * Toolbelt Execution Safety Layer
 */
export class ToolRunner {
  private static instance: ToolRunner;
  
  private constructor() {}

  public static getInstance(): ToolRunner {
    if (!ToolRunner.instance) {
      ToolRunner.instance = new ToolRunner();
    }
    return ToolRunner.instance;
  }

  /**
   * Validate and sanitize inputs before execution
   */
  private validateInput(tool: ToolModule, input: any): boolean {
    if (!tool.inputSchema) return true;
    
    // Simple schema validation (can be replaced with Ajv or similar)
    const required = tool.inputSchema.required || [];
    for (const field of required) {
      if (!(field in input)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Basic sanitization
    for (const key in input) {
      if (typeof input[key] === 'string') {
        input[key] = input[key].replace(/[<>]/g, ''); // Basic XSS prevention
      }
    }
    
    return true;
  }

  /**
   * Check permissions before execution
   */
  private checkPermissions(userRole: string, tool: ToolModule): boolean {
    const roleHierarchy: Record<string, number> = {
      'admin': 4,
      'developer': 3,
      'operator': 2,
      'viewer': 1
    };

    const userLevel = roleHierarchy[userRole] || 0;
    
    // Example: category-based permission levels
    const categoryLevels: Record<string, number> = {
      'system': 4,
      'automation': 3,
      'fivem': 2,
      'social': 2,
      'memory': 1,
      'debug': 3
    };

    const requiredLevel = categoryLevels[tool.category] || 1;
    
    if (userLevel < requiredLevel) {
      throw new Error(`Insufficient permissions to execute ${tool.name} (Category: ${tool.category})`);
    }

    return true;
  }

  /**
   * Execute a tool safely
   */
  public async execute(tool: ToolModule, input: any, userRole: string): Promise<any> {
    console.log(`[ToolRunner] Validating execution for ${tool.name}...`);
    
    this.checkPermissions(userRole, tool);
    this.validateInput(tool, input);

    // In a real production app, this would call a sandboxed backend service
    // For now, we proxy to our Express backend
    const response = await fetch('/api/toolbelt/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toolId: tool.id,
        input,
        userRole
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Tool execution failed');
    }

    return await response.json();
  }
}
