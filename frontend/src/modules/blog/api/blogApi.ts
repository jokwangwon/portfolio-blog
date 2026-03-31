import apiClient from "@/src/shell/api/client";
import type {
  PostResponse,
  PostRequest,
  CategoryResponse,
  TagResponse,
  PageResponse,
} from "@/src/types/api";

export interface PostListParams {
  page?: number;
  size?: number;
  categoryId?: number;
  sort?: string;
}

export async function fetchPosts(
  params: PostListParams = {}
): Promise<PageResponse<PostResponse>> {
  const { data } = await apiClient.get<PageResponse<PostResponse>>("/posts", {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 10,
      categoryId: params.categoryId,
      sort: params.sort ?? "createdAt,desc",
    },
  });
  return data;
}

export async function fetchPostById(id: number): Promise<PostResponse> {
  const { data } = await apiClient.get<PostResponse>(`/posts/${id}`);
  return data;
}

export async function fetchCategories(): Promise<CategoryResponse[]> {
  const { data } = await apiClient.get<CategoryResponse[]>("/categories");
  return data;
}

export async function fetchTags(): Promise<TagResponse[]> {
  const { data } = await apiClient.get<TagResponse[]>("/tags");
  return data;
}

export async function createPost(
  request: PostRequest
): Promise<PostResponse> {
  const { data } = await apiClient.post<PostResponse>("/posts", request);
  return data;
}

export async function updatePost(
  id: number,
  request: PostRequest
): Promise<PostResponse> {
  const { data } = await apiClient.put<PostResponse>(`/posts/${id}`, request);
  return data;
}

export async function deletePost(id: number): Promise<void> {
  await apiClient.delete(`/posts/${id}`);
}
