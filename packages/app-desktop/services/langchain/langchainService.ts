import { ContextExtractor, ExtractedContext } from './contextExtractor';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { llmConfig, tracingConfig } from './config';
import { ConsoleCallbackHandler } from '@langchain/core/tracers/console';
import { LangChainTracer } from 'langchain/callbacks';

export class LangChainService {
    // Core service state
    private initialized = false;
    private contextExtractor: ContextExtractor;
    private llm: ChatOpenAI | null = null;

    // Handler management
    private consoleTracer: ConsoleCallbackHandler | null = null;

    private async initialize() {
        if (this.initialized) return;

        console.log('[LangChainService] Initializing service...');
        console.log('[LangChainService] Creating ContextExtractor...');
        this.contextExtractor = new ContextExtractor();

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
    async processMessage(message: string, noteContent: string): Promise<{
        response: string;
        contexts: ExtractedContext[];
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
            
            systemPrompt += '\n\nAlways be concise and relevant to the user\'s query.';
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

            return {
                response: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
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
