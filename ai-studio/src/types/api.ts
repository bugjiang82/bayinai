// ==================== 统一 API 响应 ====================

export interface ApiResponse<T = unknown> {
  /** 状态码 */
  code: number;
  /** 提示消息 */
  message: string;
  /** 响应数据 */
  data: T;
}

// ==================== 分页 ====================

export interface PaginationParams {
  /** 当前页码，从1开始 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

export interface PaginatedData<T> {
  /** 数据列表 */
  list: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

// ==================== 错误响应 ====================

export interface ApiError {
  code: number;
  message: string;
  details?: Record<string, string[]>;
}

// ==================== 常用响应工厂函数 ====================

export function success<T>(data: T, message = "success"): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
  };
}

export function error(
  message: string,
  code = -1,
  details?: Record<string, string[]>
): ApiError {
  return {
    code,
    message,
    details,
  };
}

export function paginated<T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number
): ApiResponse<PaginatedData<T>> {
  return {
    code: 0,
    message: "success",
    data: {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
