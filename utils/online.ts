export function isOnline(lastSeen: Date | string | null | undefined): boolean {
  if (!lastSeen) return false;
  return new Date(lastSeen).getTime() > Date.now() - 5 * 60 * 1000;
}
