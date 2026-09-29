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
import { canWritePosts } from "@/src/shell/auth/publicAccess";
import Loading from "@/src/shared/components/Loading";
import { useEffect } from "react";

export default function NewPostPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || catLoading || tagsLoading) return <Loading />;
  if (!isAuthenticated) return null;
  if (!canWritePosts(user)) return <p>글 관리는 관리자만 사용할 수 있습니다.</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">새 글 작성</h1>
      <PostEditor
        categories={categories ?? []}
        tags={tags ?? []}
        onSubmit={(data) => createPost.mutateAsync(data)}
        onSaved={(saved) => {
          router.replace(saved.status === "PUBLISHED" ? `/blog/${saved.id}` : `/blog/editor/${saved.id}`);
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
