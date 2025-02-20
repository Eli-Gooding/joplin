import { ContextExtractor, ExtractedContext } from './contextExtractor';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { llmConfig, tracingConfig } from './config';
import { CallbackManager } from '@langchain/core/callbacks/manager';
import { DiffGenerator, DiffOperation } from './diffGenerator';
import { ModelAdapter } from './models/base';
import { OpenAIModelAdapter } from './models/openai';
import { LlamaModelAdapter } from './models/llama';
import { getEnvVariables } from './env';
import { InMemoryStore } from './memory/inMemoryStore';
import { MemoryStore } from './memory/types';

export class LangChainService {
    // Core service state
    private initialized = false;
    private contextExtractor: ContextExtractor = new ContextExtractor();
    private diffGenerator: DiffGenerator = new DiffGenerator();
    private model: ModelAdapter | null = null;
    private memoryStore: MemoryStore = new InMemoryStore();
    private maxMemoryMessages = 10; // Keep last 10 messages by default



    /**
     * Format a diff operation for preview in the chat
     */
    private formatDiffPreview(diff: DiffOperation): string {
        let preview = '';
        
        for (const range of diff.ranges) {
            if (range.originalText && range.newText) {
                preview += '```diff\n';
                // Split and format deletions, handling special case of '- +' lines
                const deletions = range.originalText.split('\n').map(line => {
                    if (line.startsWith('+ ')) {
                        return '- +' + line.substring(2);
                    }
                    return '- ' + line;
                }).join('\n');
                preview += deletions;
                preview += '\n';
                
                // Split and format additions
                preview += range.newText.split('\n').map(line => '+ ' + line).join('\n');
                preview += '```\n';
            } else if (range.originalText) {
                preview += '```diff\n';
                preview += '- ' + range.originalText.split('\n').join('\n- ');
                preview += '```\n';
            } else if (range.newText) {
                preview += '```diff\n';
                preview += '+ ' + range.newText.split('\n').join('\n+ ');
                preview += '```\n';
            }
        }
        
        return preview;
    }

    /**
     * Get the chat memory for a note
     */
    async getMemory(noteId: string) {
        const memory = await this.memoryStore.get(noteId);
        return memory.messages.map(msg => ({
            role: msg._getType(),
            content: msg.content
        }));
    }

    /**
     * Clear chat memory for a specific note or all notes
     */
    async clearMemory(noteId?: string) {
        if (noteId) {
            await this.memoryStore.clear(noteId);
        } else {
            await this.memoryStore.clearAll();
        }
    }

    private async initialize() {
        if (this.initialized) return;

        console.log('[LangChainService] Initializing service...');
        console.log('[LangChainService] Service components already initialized...');



        // Initialize LangSmith tracing if configured
        if (tracingConfig.enabled && tracingConfig.client) {
            console.log('[LangChainService] LangSmith tracing enabled with project:', tracingConfig.projectName);
        }

        console.log('[LangChainService] Initializing ChatOpenAI with config:', {
            model: llmConfig.model,
            temperature: llmConfig.temperature,
            maxTokens: llmConfig.maxTokens,
            hasApiKey: !!llmConfig.openAIApiKey,
            hasLangSmithTracer: tracingConfig.enabled
        });
        
        // Initialize model adapter based on settings
        const env = getEnvVariables();
        if (env.MODEL_TYPE === 'openai') {
            if (!env.OPENAI_API_KEY) {
                throw new Error('OpenAI API key is required when using OpenAI model');
            }
            this.model = new OpenAIModelAdapter(env.OPENAI_API_KEY);
        } else if (env.MODEL_TYPE === 'llama') {
            if (!env.LLAMA_ENDPOINT) {
                throw new Error('Llama endpoint is required when using Llama model');
            }
            this.model = new LlamaModelAdapter(env.LLAMA_ENDPOINT);
        } else {
            throw new Error(`Unsupported model type: ${env.MODEL_TYPE}`);
        }

        await this.model.initialize();

        this.initialized = true;
    }

    /**
     * Process a chat message with the current note's context
     * @param message The user's message
     * @param noteContent The current note's content
     * @returns The processed response
     */
    async processMessage(message: string, noteContent: string, noteId?: string): Promise<{
        response: string;
        contexts: ExtractedContext[];
        suggestedEdit?: DiffOperation;
    }> {
        if (!this.initialized) {
            await this.initialize();
        }

        let callbacks;
        if (tracingConfig.enabled && tracingConfig.client) {
            const handler = {
                handleLLMStart: async () => {
                    console.log('[LangChainService] Starting LLM call...');
                },
                handleLLMEnd: async () => {
                    console.log('[LangChainService] LLM call completed.');
                },
                handleLLMError: async (err: Error) => {
                    console.error('[LangChainService] LLM call error:', err);
                }
            };
            callbacks = CallbackManager.fromHandlers(handler);
        }

        if (!this.model) {
            throw new Error('LangChainService not properly initialized');
        }

        // Chain tracing is now handled automatically by the callbacks

        try {
            // Extract and format context
            console.log('[LangChainService] Extracting context from note...', { noteLength: noteContent.length });
            const contexts = await this.contextExtractor.extractContext(noteContent, message);
            console.log('[LangChainService] Extracted contexts:', { 
                numContexts: contexts.length,
                contextLengths: contexts.map(c => c.content.length),
                contexts: contexts.map(c => c.content.substring(0, 100) + '...') // First 100 chars of each context
            });

            // Get chat memory
            const memory = await this.memoryStore.get(noteId || 'default');
            console.log('[LangChainService] Retrieved memory:', {
                messageCount: memory.messages.length,
                messages: memory.messages.map(msg => ({
                    role: msg._getType(),
                    content: typeof msg.content === 'string' ? 
                        msg.content.substring(0, 100) + '...' : 
                        JSON.stringify(msg.content).substring(0, 100) + '...'
                }))
            });
            
            // Create system message with smart context selection instructions
            let systemPrompt = 'You are a helpful AI assistant helping users interact with their notes. ';
            systemPrompt += 'You have access to both the current note content and the conversation history. ';
            systemPrompt += 'For each user query, carefully analyze the intent and available information:\n';
            systemPrompt += '1. For conversation references - Use conversation history when the user:\n';
            systemPrompt += '   - Asks about previous interactions ("what did I/you say", "you mentioned", "earlier", "before", "last time")\n';
            systemPrompt += '   - Refers to temporal aspects ("just now", "previously", "first", "last", "recent")\n';
            systemPrompt += '   - Uses pronouns referring to conversation ("that", "it", "this", when referring to previous statements)\n';
            systemPrompt += '2. For note content - Use note context when the user:\n';
            systemPrompt += '   - Explicitly mentions the note ("in the note", "this content", "the text")\n';
            systemPrompt += '   - Asks about specific content that appears in the note\n';
            systemPrompt += '   - Requests operations on the note (summarize, edit, analyze)\n';
            systemPrompt += '3. If the intent is unclear:\n';
            systemPrompt += '   - Check both sources\n';
            systemPrompt += '   - Prioritize the most relevant information\n';
            systemPrompt += '   - Consider combining information from both sources if appropriate\n';
            
            // Add note context if available
            let hasRelevantContext = false;
            if (contexts.length > 0) {
                const contextText = contexts
                    .map(ctx => ctx.content.trim())
                    .join('\n\n');
                systemPrompt += '\n\nCurrent note context:\n\n' + contextText;
                hasRelevantContext = true;
            } else {
                systemPrompt += '\n\nNote: No relevant context found in the current note.';
            }

            // Add memory context if available
            if (memory.messages.length > 0) {
                systemPrompt += '\n\nConversation history:\n';
                memory.messages.forEach(msg => {
                    // Use _getType() for now as it's the only way to get the message type
                    const role = msg._getType() === 'human' ? 'User' : 'Assistant';
                    systemPrompt += `\n${role}: ${msg.content}`;
                });
            } else {
                systemPrompt += '\n\nNote: No conversation history available.';
            }

            // Add final instructions based on available context
            if (hasRelevantContext && memory.messages.length > 0) {
                systemPrompt += '\n\nBoth note context and conversation history are available. Choose the most relevant source(s) to answer the query.';
            } else if (hasRelevantContext) {
                systemPrompt += '\n\nOnly note context is available.';
            } else if (memory.messages.length > 0) {
                systemPrompt += '\n\nOnly conversation history is available.';
            } else {
                systemPrompt += '\n\nNo context or history available. Answer based on general knowledge.';
            }
            
            systemPrompt += '\n\nYou can suggest edits to the note by starting your response with "[EDIT]" followed by the complete new content for the note. Otherwise, be concise and relevant to the user\'s query.';
            console.log('[LangChainService] System prompt:', {
                length: systemPrompt.length,
                preview: systemPrompt.substring(0, 200) + '...' // First 200 chars of system prompt
            });
            
            const systemMessage = new SystemMessage(systemPrompt);

            // Create human message
            const humanMessage = new HumanMessage(message);

            // Construct messages array with memory and current messages
            // Build message array including memory
            const messages: BaseMessage[] = [
                systemMessage,
                ...memory.messages,  // Include previous conversation
                humanMessage,  // Add current message last
            ];

            console.log('[LangChainService] Sending messages to LLM:', {
                totalMessages: messages.length,
                systemMessage: messages[0]._getType(),
                memoryMessages: memory.messages.length,
                finalMessage: messages[messages.length - 1]._getType()
            });

            console.log('[LangChainService] Sending request to LLM...');
            const response = await this.model.call(
                messages,
                {
                    callbacks,
                    tags: ['joplin-chat'],
                    metadata: {
                        contextCount: contexts.length,
                        messageLength: message.length,
                        systemPromptLength: systemPrompt.length,
                        memoryMessageCount: memory.messages.length
                    }
                }
            );

            // Update memory with the new messages
            const aiMessage = new AIMessage(response.content);
            memory.messages.push(humanMessage);
            memory.messages.push(aiMessage);
            memory.maxMessages = this.maxMemoryMessages;
            await this.memoryStore.update(noteId || 'default', memory);
            console.log('[LangChainService] Received response from LLM:', { responseLength: response.content.length });

            // Chain end is handled automatically

            const responseContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
            
            // Check if this is an edit suggestion
            let suggestedEdit: DiffOperation | undefined;
            if (responseContent.startsWith('[EDIT]') && noteId) {
                console.log('[LangChainService] Detected edit suggestion');
                const newContent = responseContent.substring('[EDIT]'.length).trim();
                console.log('[LangChainService] Creating diff operation:', {
                    noteId,
                    originalLength: noteContent.length,
                    newLength: newContent.length
                });
                suggestedEdit = this.diffGenerator.createDiffOperation(noteId, noteContent, newContent);
                console.log('[LangChainService] Generated diff:', {
                    numRanges: suggestedEdit.ranges.length,
                    ranges: suggestedEdit.ranges
                });
                
                // Remove the [EDIT] prefix from the response
                return {
                    response: `I suggest the following changes to your note:\n${this.formatDiffPreview(suggestedEdit)}`,
                    contexts,
                    suggestedEdit,
                };
            }

            return {
                response: responseContent,
                contexts,
            };
        } catch (error) {
            console.error('[LangChainService] Error processing message:', error);
            console.error('[LangChainService] Error stack:', error.stack);
            // Chain errors are handled automatically
            throw error;
        }
    }
}
