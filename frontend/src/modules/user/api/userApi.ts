import apiClient from "@/src/shell/api/client";

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export async function fetchMyProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>("/users/me");
  return data;
}

export async function changePassword(
  request: ChangePasswordRequest
): Promise<void> {
  await apiClient.put("/users/me/password", request);
}
