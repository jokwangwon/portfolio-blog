"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/shell/auth/useAuth";
import {
  usePostDetail,
  useCategories,
  useTags,
  useUpdatePost,
  useCreateCategory,
  useDeleteCategory,
  useCreateTag,
  useDeleteTag,
  useSummarizePost,
} from "@/src/modules/blog/hooks/usePosts";
import PostEditor from "@/src/modules/blog/components/PostEditor";
import Loading from "@/src/shared/components/Loading";
import { clearDraft } from "@/src/modules/blog/hooks/useAutoSave";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const postId = parseInt(id, 10);
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: post, isLoading: postLoading } = usePostDetail(postId);
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: tags, isLoading: tagsLoading } = useTags();
  const updatePost = useUpdatePost();
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

  if (authLoading || postLoading || catLoading || tagsLoading)
    return <Loading />;
  if (!isAuthenticated) return null;

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">
          게시글을 찾을 수 없습니다.
        </p>
        <Link href="/blog" className={buttonVariants({ variant: "link" })}>
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  if (user?.username !== post.author.username) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">
          본인이 작성한 글만 수정할 수 있습니다.
        </p>
        <Link
          href={`/blog/${post.id}`}
          className={buttonVariants({ variant: "link" })}
        >
          게시글로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">글 수정</h1>
      <PostEditor
        initialData={post}
        categories={categories ?? []}
        tags={tags ?? []}
        onSubmit={(data) => {
          updatePost.mutate(
            { id: postId, request: data },
            {
              onSuccess: () => {
                clearDraft(postId);
                router.push(`/blog/${postId}`);
              },
            }
          );
        }}
        isPending={updatePost.isPending}
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
