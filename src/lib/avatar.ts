export function getAvatarUrl({ email }: { email?: string }): string {
  if (email === undefined) {
    return "";
  }
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${email}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}
