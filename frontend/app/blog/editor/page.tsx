"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/src/shell/auth/useAuth";
import {
  useCategories,
  useTags,
  useCreatePost,
} from "@/src/modules/blog/hooks/usePosts";
import PostEditor from "@/src/modules/blog/components/PostEditor";
import Loading from "@/src/shared/components/Loading";
import { useEffect } from "react";
import { toast } from "sonner";

export default function NewPostPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: tags, isLoading: tagsLoading } = useTags();
  const createPost = useCreatePost();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || catLoading || tagsLoading) return <Loading />;
  if (!isAuthenticated) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6 tracking-tight">새 글 작성</h1>
      <PostEditor
        categories={categories ?? []}
        tags={tags ?? []}
        onSubmit={(data) => {
          createPost.mutate(data, {
            onSuccess: (post) => {
              toast.success("게시글이 작성되었습니다.");
              router.push(`/blog/${post.id}`);
            },
            onError: () => {
              toast.error("게시글 작성에 실패했습니다.");
            },
          });
        }}
        isPending={createPost.isPending}
      />
    </div>
  );
}
