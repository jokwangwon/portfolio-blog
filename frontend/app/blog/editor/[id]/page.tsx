"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/shell/auth/useAuth";
import {
  usePostDetail,
  useCategories,
  useTags,
  useUpdatePost,
} from "@/src/modules/blog/hooks/usePosts";
import PostEditor from "@/src/modules/blog/components/PostEditor";
import Loading from "@/src/shared/components/Loading";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
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
                toast.success("게시글이 수정되었습니다.");
                router.push(`/blog/${postId}`);
              },
              onError: () => {
                toast.error("게시글 수정에 실패했습니다.");
              },
            }
          );
        }}
        isPending={updatePost.isPending}
      />
    </div>
  );
}
