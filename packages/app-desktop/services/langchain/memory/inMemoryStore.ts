import { ChatMemory, MemoryStore } from './types';

export class InMemoryStore implements MemoryStore {
    private memories: Map<string, ChatMemory> = new Map();

    private DEFAULT_MAX_MESSAGES = 10;

    async get(noteId: string): Promise<ChatMemory> {
        return this.memories.get(noteId) || { messages: [], maxMessages: this.DEFAULT_MAX_MESSAGES };
    }

    async update(noteId: string, memory: ChatMemory): Promise<void> {
        // Ensure maxMessages is set
        memory.maxMessages = memory.maxMessages || this.DEFAULT_MAX_MESSAGES;
        
        // Keep the most recent messages up to maxMessages
        if (memory.messages.length > memory.maxMessages) {
            memory.messages = memory.messages.slice(-memory.maxMessages);
        }
        this.memories.set(noteId, memory);
    }

    async clear(noteId: string): Promise<void> {
        this.memories.delete(noteId);
    }

    async clearAll(): Promise<void> {
        this.memories.clear();
    }
}
