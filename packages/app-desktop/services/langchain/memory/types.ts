import { BaseMessage } from '@langchain/core/messages';

export interface ChatMemory {
    messages: BaseMessage[];
    maxMessages?: number;
}

export interface MemoryStore {
    // Get chat memory for a specific note
    get(noteId: string): Promise<ChatMemory>;
    
    // Update chat memory for a specific note
    update(noteId: string, memory: ChatMemory): Promise<void>;
    
    // Clear chat memory for a specific note
    clear(noteId: string): Promise<void>;
    
    // Clear all chat memories
    clearAll(): Promise<void>;
}
