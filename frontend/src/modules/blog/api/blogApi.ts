import apiClient from "@/src/shell/api/client";
import type {
  PostResponse,
  PostRequest,
  CategoryResponse,
  TagResponse,
  LikeResponse,
  CommentResponse,
  CommentRequest,
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

// === Like ===

export async function likePost(postId: number): Promise<LikeResponse> {
  const { data } = await apiClient.post<LikeResponse>(
    `/posts/${postId}/like`
  );
  return data;
}

export async function unlikePost(postId: number): Promise<LikeResponse> {
  const { data } = await apiClient.delete<LikeResponse>(
    `/posts/${postId}/like`
  );
  return data;
}

// === Comment ===

export interface CommentListParams {
  postId: number;
  page?: number;
  size?: number;
}

export async function fetchComments(
  params: CommentListParams
): Promise<PageResponse<CommentResponse>> {
  const { data } = await apiClient.get<PageResponse<CommentResponse>>(
    `/posts/${params.postId}/comments`,
    {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    }
  );
  return data;
}

export async function createComment(
  postId: number,
  request: CommentRequest
): Promise<CommentResponse> {
  const { data } = await apiClient.post<CommentResponse>(
    `/posts/${postId}/comments`,
    request
  );
  return data;
}

export async function updateComment(
  postId: number,
  commentId: number,
  request: CommentRequest
): Promise<CommentResponse> {
  const { data } = await apiClient.put<CommentResponse>(
    `/posts/${postId}/comments/${commentId}`,
    request
  );
  return data;
}

export async function deleteComment(
  postId: number,
  commentId: number
): Promise<void> {
  await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
}

// === Search ===

export interface SearchParams {
  keyword: string;
  page?: number;
  size?: number;
}

export async function searchPosts(
  params: SearchParams
): Promise<PageResponse<PostResponse>> {
  const { data } = await apiClient.get<PageResponse<PostResponse>>(
    "/posts/search",
    {
      params: {
        keyword: params.keyword,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    }
  );
  return data;
}
