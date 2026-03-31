import { useQuery } from "@tanstack/react-query";
import {
  fetchPosts,
  fetchPostById,
  fetchCategories,
  PostListParams,
} from "@modules/blog/api/blogApi";

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

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
}
