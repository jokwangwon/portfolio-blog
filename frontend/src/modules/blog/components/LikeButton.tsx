"use client";

import { useState } from "react";
import { useAuth } from "@/src/shell/auth/useAuth";
import { useLikePost, useUnlikePost } from "@/src/modules/blog/hooks/usePosts";
import { Button } from "@/components/ui/button";
import { HeartIcon } from "lucide-react";

interface LikeButtonProps {
  postId: number;
  likeCount: number;
}

export default function LikeButton({ postId, likeCount }: LikeButtonProps) {
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(false);
  const [optimisticCount, setOptimisticCount] = useState(likeCount);
  const like = useLikePost();
  const unlike = useUnlikePost();

  const isPending = like.isPending || unlike.isPending;

  function handleToggle() {
    if (!isAuthenticated || isPending) return;

    if (liked) {
      setLiked(false);
      setOptimisticCount((c) => Math.max(0, c - 1));
      unlike.mutate(postId, {
        onError: () => {
          setLiked(true);
          setOptimisticCount((c) => c + 1);
        },
      });
    } else {
      setLiked(true);
      setOptimisticCount((c) => c + 1);
      like.mutate(postId, {
        onError: () => {
          setLiked(false);
          setOptimisticCount((c) => Math.max(0, c - 1));
        },
      });
    }
  }

  return (
    <Button
      variant={liked ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={!isAuthenticated || isPending}
      className="gap-1.5"
    >
      <HeartIcon
        className={`size-4 ${liked ? "fill-current" : ""}`}
      />
      <span>{optimisticCount}</span>
    </Button>
  );
}
