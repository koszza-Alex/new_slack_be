export interface SearchResult {
  type: "user" | "channel" | "message";

  id: string;

  title: string;

  desc: string;

  workspaceId?: string;

  channelId?: string;
}