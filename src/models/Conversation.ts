import { Turn } from "./Turn";

export interface Conversation {
  id: string; // UUID
  turns: Turn[];
}