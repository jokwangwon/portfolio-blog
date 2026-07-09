"use client";

import type { UserProfile } from "../api/userApi";
import { formatDateTime } from "@/src/shared/utils/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfileCard({ profile }: { profile: UserProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {profile.username}
          <Badge variant={profile.role === "ADMIN" ? "default" : "secondary"}>
            {profile.role}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>이메일: {profile.email}</p>
        <p>가입일: {formatDateTime(profile.createdAt)}</p>
      </CardContent>
    </Card>
  );
}
