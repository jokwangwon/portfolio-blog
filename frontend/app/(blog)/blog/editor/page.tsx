"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/src/shell/auth/useAuth";
import {
  useCategories,
  useTags,
  useCreatePost,
  useCreateCategory,
  useDeleteCategory,
  useCreateTag,
  useDeleteTag,
  useSummarizePost,
} from "@/src/modules/blog/hooks/usePosts";
import PostEditor from "@/src/modules/blog/components/PostEditor";
import Loading from "@/src/shared/components/Loading";
import { clearDraft } from "@/src/modules/blog/hooks/useAutoSave";
import { useEffect } from "react";

export default function NewPostPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: tags, isLoading: tagsLoading } = useTags();
  const createPost = useCreatePost();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const summarize = useSummarizePost();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || catLoading || tagsLoading) return <Loading />;
  if (!isAuthenticated) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">새 글 작성</h1>
      <PostEditor
        categories={categories ?? []}
        tags={tags ?? []}
        onSubmit={(data) => {
          createPost.mutate(data, {
            onSuccess: (post) => {
              clearDraft();
              router.push(`/blog/${post.id}`);
            },
          });
        }}
        isPending={createPost.isPending}
        onCreateCategory={async (name) => {
          return await createCategory.mutateAsync({ name });
        }}
        onDeleteCategory={async (id) => {
          await deleteCategory.mutateAsync(id);
        }}
        onCreateTag={async (name) => {
          return await createTag.mutateAsync({ name });
        }}
        onDeleteTag={async (id) => {
          await deleteTag.mutateAsync(id);
        }}
        onSummarize={async (content, title) => {
          const result = await summarize.mutateAsync({ content, title });
          return result.summary;
        }}
        isSummarizing={summarize.isPending}
      />
    </div>
  );
}
