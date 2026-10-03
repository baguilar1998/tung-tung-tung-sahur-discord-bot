export interface MentionedUser {
  id: string;
  handle: string;
}

const USER_MENTION = /<@!?(\d+)>/g;

/** Turns Discord mention markup into @handle text the model can read and repeat. */
export function revealUserMentions(content: string, users: readonly MentionedUser[]): string {
  return content.replace(USER_MENTION, (match, id: string) => {
    const handle = users.find((user) => user.id === id)?.handle;
    return handle ? `@${handle}` : match;
  });
}

/** Turns @handle text back into mention markup, only for users already in the message. */
export function linkUserMentions(content: string, users: readonly MentionedUser[]): string {
  let linked = content;
  for (const user of users) {
    if (!user.handle) continue;
    const pattern = new RegExp(`(?<![\\w@])@${escapeRegExp(user.handle)}(?!\\w)`, "gi");
    linked = linked.replace(pattern, `<@${user.id}>`);
  }
  return linked;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
