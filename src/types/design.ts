export type DesignRole = "user" | "assistant";

export interface DesignMessage {
  role: DesignRole;
  content: string;
}
