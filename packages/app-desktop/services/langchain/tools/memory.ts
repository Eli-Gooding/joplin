import { Tool } from '@langchain/core/tools';
import { z } from 'zod';
import { LangChainService } from '../langchainService';

/**
 * Tool for managing chat memory
 */
export class ChatMemoryTool extends Tool {
    name = 'chat_memory';
    description = 'Tool for managing chat memory. Use this to view or clear chat history.';
    schema = z.object({
        input: z.string().optional().describe('JSON string containing action ("view" or "clear") and optional noteId')
    }).transform(async (data) => {
        if (!data.input) throw new Error('Input is required');
        try {
            const parsed = JSON.parse(data.input);
            const action = parsed.action;
            if (action !== 'view' && action !== 'clear') {
                throw new Error('Action must be either "view" or "clear"');
            }
            return data.input;
        } catch (e) {
            throw new Error(`Invalid input: ${e.message}`);
        }
    });

    constructor(private service: LangChainService) {
        super();
    }

    protected async _call(args: { input: string }): Promise<string> {
        const input = JSON.parse(args.input);
        const action = input.action as 'view' | 'clear';
        const noteId = input.noteId as string | undefined;

        if (action === 'view') {
            if (!noteId) {
                throw new Error('noteId is required for viewing chat memory');
            }
            const messages = await this.service.getMemory(noteId);
            return JSON.stringify(messages, null, 2);
        } else if (action === 'clear') {
            await this.service.clearMemory(noteId);
            return noteId 
                ? `Cleared chat memory for note ${noteId}`
                : 'Cleared all chat memory';
        }

        throw new Error(`Unknown action: ${action}`);
    }
}
