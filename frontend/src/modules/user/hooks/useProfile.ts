import { useMutation, useQuery } from "@tanstack/react-query";
import {
  changePassword,
  fetchMyProfile,
  type ChangePasswordRequest,
} from "../api/userApi";

export function useMyProfile() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: fetchMyProfile,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (request: ChangePasswordRequest) => changePassword(request),
  });
}
