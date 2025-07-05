import { z } from 'zod';
import { ValidationError } from './errors.js';

/**
 * Common validation schemas
 */
export const commonSchemas = {
  repositoryName: z.string().min(1, 'Repository name is required').max(100),
  componentName: z.string().min(1, 'Component name is required').max(200),
  version: z.string().min(1, 'Version is required').max(100),
  format: z.enum(['npm', 'maven2', 'nuget', 'pypi', 'docker', 'raw', 'yum', 'apt']),
  repositoryType: z.enum(['hosted', 'proxy', 'group']),
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional()
};

/**
 * Repository listing parameters
 */
export const listRepositoriesSchema = z.object({
  format: commonSchemas.format.optional(),
  type: commonSchemas.repositoryType.optional()
}).strict();

/**
 * Repository details parameters
 */
export const getRepositorySchema = z.object({
  name: commonSchemas.repositoryName
});

/**
 * Component search parameters
 */
export const searchComponentsSchema = z.object({
  repository: commonSchemas.repositoryName.optional(),
  format: commonSchemas.format.optional(),
  group: z.string().optional(),
  name: z.string().optional(),
  version: z.string().optional(),
  prerelease: z.boolean().optional(),
  sort: z.enum(['name', 'version', 'format']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  limit: commonSchemas.limit.default(25),
  offset: commonSchemas.offset.default(0)
}).strict();

/**
 * Component details parameters
 */
export const getComponentSchema = z.object({
  id: z.string().min(1, 'Component ID is required')
});

/**
 * System status parameters (no parameters needed)
 */
export const getSystemStatusSchema = z.object({});

/**
 * Blob store listing parameters (no parameters needed)
 */
export const listBlobStoresSchema = z.object({});

/**
 * Validate input parameters against a schema
 */
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ValidationError(`Validation failed: ${issues}`);
    }
    throw new ValidationError(`Validation failed: ${error}`);
  }
}

/**
 * Sanitize string input for API calls
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Check if tools are enabled
 */
export function isToolEnabled(toolName: string, enabledTools: string[]): boolean {
  return enabledTools.length === 0 || enabledTools.includes(toolName);
}