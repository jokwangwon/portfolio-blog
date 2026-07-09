"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/shell/auth/useAuth";
import { useMyProfile, ProfileCard, PasswordChangeForm } from "@/src/modules/user";
import { useMyPosts } from "@/src/modules/blog/hooks/usePosts";
import PostCard from "@/src/modules/blog/components/PostCard";
import Loading from "@/src/shared/components/Loading";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";

export default function MyPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: myPosts, isLoading: postsLoading } = useMyPosts({ size: 5 });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated || profileLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">마이페이지</h1>

      {profile && <ProfileCard profile={profile} />}

      <PasswordChangeForm />

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">내가 쓴 글</h2>
          <Link
            href="/blog/drafts"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            임시저장 글 보기
          </Link>
        </div>

        {postsLoading ? (
          <Loading />
        ) : myPosts && myPosts.content.length > 0 ? (
          <div className="grid gap-4">
            {myPosts.content.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            아직 작성한 글이 없습니다.
          </p>
        )}
      </section>
    </div>
  );
}
