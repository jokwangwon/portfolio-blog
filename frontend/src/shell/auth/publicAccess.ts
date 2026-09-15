// NEXT_PUBLIC values are fixed when the frontend is built.
export const PUBLIC_READ_ONLY = process.env.NEXT_PUBLIC_PUBLIC_READ_ONLY === "true";

export function canWritePosts(user: { role: string } | null | undefined): boolean {
  return !!user && (!PUBLIC_READ_ONLY || user.role === "ADMIN" || user.role === "ROLE_ADMIN");
}
