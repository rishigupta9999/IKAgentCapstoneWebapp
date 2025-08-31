import { ConversationAnalysis } from "./ConversationAnalysis";
import { Turn } from "./Turn";

export interface Conversation {
  conversation_id: string; // UUID
  turns: Turn[];
  conversation_analysis?: ConversationAnalysis;
}