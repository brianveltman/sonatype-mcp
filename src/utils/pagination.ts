/**
 * Pagination parameters interface
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  totalCount: number,
  limit: number,
  offset: number
): PaginationMeta {
  const pageSize = limit;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    totalCount,
    pageSize,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  totalCount: number,
  limit: number,
  offset: number
): PaginatedResponse<T> {
  return {
    items,
    meta: createPaginationMeta(totalCount, limit, offset)
  };
}

/**
 * Calculate offset from page number
 */
export function calculateOffset(page: number, limit: number): number {
  return Math.max(0, (page - 1) * limit);
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params: PaginationParams): { limit: number; offset: number } {
  const limit = Math.min(Math.max(params.limit || 25, 1), 1000);
  const offset = Math.max(params.offset || 0, 0);
  
  return { limit, offset };
}