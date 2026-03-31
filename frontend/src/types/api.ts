// === Auth ===

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface UserInfo {
  username: string;
  authorities: string[];
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// === Blog ===

export interface Author {
  id: number;
  username: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

export interface TagResponse {
  id: number;
  name: string;
  slug: string;
}

export interface PostResponse {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  viewCount: number;
  likeCount: number;
  author: Author;
  category?: CategoryResponse;
  tags: TagResponse[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// === Blog Requests ===

export interface PostRequest {
  title: string;
  content: string;
  excerpt?: string;
  categoryId?: number;
  tagIds?: number[];
  status?: "DRAFT" | "PUBLISHED";
}

// === Error ===

export interface ApiError {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  errors?: Record<string, string>;
}
