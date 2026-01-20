import { notionists } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";

export function getAvatarUrl({ email }: { email?: string }): string {
  const avatar = createAvatar(notionists, {
    seed: email,
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9"],
    backgroundType: ["solid"],
  });
  return avatar.toDataUri();
}
