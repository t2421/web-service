export function getInitials(name?: string | null, email?: string | null): string {
  return (name ?? email ?? "?").slice(0, 2).toUpperCase();
}
