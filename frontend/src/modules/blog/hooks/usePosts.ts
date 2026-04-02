import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPosts,
  fetchPostById,
  fetchCategories,
  fetchTags,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  searchPosts,
  fetchMyPosts,
  createCategory,
  deleteCategory,
  createTag,
  deleteTag,
  PostListParams,
  MyPostListParams,
  CommentListParams,
  SearchParams,
  summarizePost,
  SummarizeRequest,
} from "@modules/blog/api/blogApi";
import type { PostRequest, CommentRequest } from "@/src/types/api";

// === Posts ===

export function usePosts(params: PostListParams = {}) {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: () => fetchPosts(params),
  });
}

export function usePostDetail(id: number) {
  return useQuery({
    queryKey: ["posts", id],
    queryFn: () => fetchPostById(id),
    enabled: id > 0,
  });
}

export function useMyPosts(params: MyPostListParams = {}) {
  return useQuery({
    queryKey: ["posts", "my", params],
    queryFn: () => fetchMyPosts(params),
  });
}

export function useSearchPosts(params: SearchParams) {
  return useQuery({
    queryKey: ["posts", "search", params],
    queryFn: () => searchPosts(params),
    enabled: params.keyword.trim().length > 0,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: { name: string; description?: string }) =>
      createCategory(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: { name: string }) => createTag(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: PostRequest) => createPost(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: PostRequest }) =>
      updatePost(id, request),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts", variables.id] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

// === AI Summarization ===

export function useSummarizePost() {
  return useMutation({
    mutationFn: (request: SummarizeRequest) => summarizePost(request),
  });
}

// === Like ===

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => likePost(postId),
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts", postId] });
    },
  });
}

export function useUnlikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => unlikePost(postId),
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts", postId] });
    },
  });
}

// === Comments ===

export function useComments(params: CommentListParams) {
  return useQuery({
    queryKey: ["comments", params.postId, params.page],
    queryFn: () => fetchComments(params),
    enabled: params.postId > 0,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      request,
    }: {
      postId: number;
      request: CommentRequest;
    }) => createComment(postId, request),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      commentId,
      request,
    }: {
      postId: number;
      commentId: number;
      request: CommentRequest;
    }) => updateComment(postId, commentId, request),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      commentId,
    }: {
      postId: number;
      commentId: number;
    }) => deleteComment(postId, commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId],
      });
    },
  });
}
