import { ContextExtractor, ExtractedContext } from './contextExtractor';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { llmConfig, tracingConfig } from './config';
import { ConsoleCallbackHandler } from '@langchain/core/tracers/console';
import { LangChainTracer } from 'langchain/callbacks';
import { DiffGenerator, DiffOperation } from './diffGenerator';

export class LangChainService {
    // Core service state
    private initialized = false;
    private contextExtractor: ContextExtractor = new ContextExtractor();
    private diffGenerator: DiffGenerator = new DiffGenerator();
    private llm: ChatOpenAI | null = null;

    // Handler management
    private consoleTracer: ConsoleCallbackHandler | null = null;

    /**
     * Format a diff operation for preview in the chat
     */
    private formatDiffPreview(diff: DiffOperation): string {
        let preview = '';
        
        for (const range of diff.ranges) {
            if (range.originalText && range.newText) {
                preview += '```diff\n';
                preview += '- ' + range.originalText.split('\n').join('\n- ');
                preview += '+ ' + range.newText.split('\n').join('\n+ ');
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

    private async initialize() {
        if (this.initialized) return;

        console.log('[LangChainService] Initializing service...');
        console.log('[LangChainService] Service components already initialized...');

        // Always use console tracing for debugging
        this.consoleTracer = new ConsoleCallbackHandler();

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
        
        // Initialize LLM with tracers
        const callbacks: any[] = [this.consoleTracer];
        if (tracingConfig.enabled && tracingConfig.client) {
            // The client implements the necessary callback interfaces
            callbacks.push(tracingConfig.client);
        }

        this.llm = new ChatOpenAI({
            modelName: llmConfig.model,
            temperature: llmConfig.temperature,
            maxTokens: llmConfig.maxTokens,
            openAIApiKey: llmConfig.openAIApiKey,
            callbacks,
        });

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

        let tracer;
        if (tracingConfig.enabled && tracingConfig.client) {
            tracer = new LangChainTracer({
                projectName: tracingConfig.projectName,
                client: tracingConfig.client,
            });
        }

        if (!this.llm) {
            throw new Error('LangChainService not properly initialized');
        }

        // Chain tracing is now handled automatically by the callbacks

        try {
            // Extract and format context
            console.log('[LangChainService] Extracting context from note...', { noteLength: noteContent.length });
            const contexts = await this.contextExtractor.extractContext(noteContent, message);
            console.log('[LangChainService] Extracted contexts:', { 
                numContexts: contexts.length,
                contextLengths: contexts.map(c => c.content.length)
            });

            // Create system message with context
            let systemPrompt = 'You are a helpful AI assistant helping users interact with their notes.';
            
            if (contexts.length > 0) {
                const contextText = contexts
                    .map(ctx => ctx.content.trim())
                    .join('\n\n');
                systemPrompt += '\nUse the following context from the current note to inform your responses:\n\n' + contextText;
            }
            
            systemPrompt += '\n\nYou can suggest edits to the note by starting your response with "[EDIT]" followed by the complete new content for the note. Otherwise, be concise and relevant to the user\'s query.';
            console.log('[LangChainService] System prompt length:', systemPrompt.length);
            
            const systemMessage = new SystemMessage(systemPrompt);

            // Create human message
            const humanMessage = new HumanMessage(message);



            console.log('[LangChainService] Sending request to LLM...');
            const response = await this.llm.call(
                [systemMessage, humanMessage],
                {
                    callbacks: tracer ? [tracer] : undefined,
                    tags: ['joplin-chat'],
                    metadata: {
                        contextCount: contexts.length,
                        messageLength: message.length,
                        systemPromptLength: systemPrompt.length
                    }
                }
            );
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
