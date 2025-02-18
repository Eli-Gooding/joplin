import { ContextExtractor, ExtractedContext } from './contextExtractor';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { llmConfig, tracingConfig } from './config';
import { ConsoleTracer } from './tracer';

export class LangChainService {
    private contextExtractor: ContextExtractor;
    private tracer?: ConsoleTracer;
    private llm: ChatOpenAI;

    constructor() {
        console.log('[LangChainService] Initializing service...');
        console.log('[LangChainService] Creating ContextExtractor...');
        this.contextExtractor = new ContextExtractor();

        if (tracingConfig.enabled) {
            console.log('[LangChainService] Initializing tracer...');
            this.tracer = new ConsoleTracer();
        }

        console.log('[LangChainService] Initializing ChatOpenAI with config:', {
            model: llmConfig.model,
            temperature: llmConfig.temperature,
            maxTokens: llmConfig.maxTokens,
            hasApiKey: !!llmConfig.openAIApiKey,
            hasTracer: !!this.tracer
        });
        // Initialize LLM with tracing
        this.llm = new ChatOpenAI({
            modelName: llmConfig.model,
            temperature: llmConfig.temperature,
            maxTokens: llmConfig.maxTokens,
            openAIApiKey: llmConfig.openAIApiKey,
            callbacks: tracingConfig.enabled && this.tracer ? [this.tracer] : undefined,
        });
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
        if (this.tracer) {
            await this.tracer.handleChainStart(
                {
                    lc: 1,
                    type: 'not_implemented',
                    id: ['joplin', 'chat', 'process_message']
                },
                { message_length: message.length },
                Date.now().toString()
            );
        }

        try {
            console.log('[LangChainService] Extracting context from note...', { noteLength: noteContent.length });
            const contexts = await this.contextExtractor.extractContext(noteContent, message);
            console.log('[LangChainService] Extracted contexts:', { numContexts: contexts.length });

            // Create system message with context
            const contextText = contexts
                .map(ctx => ctx.content)
                .join('\n\n');

            const systemMessage = new SystemMessage(
                `You are a helpful AI assistant helping users interact with their notes. 
                Use the following context from the current note to inform your responses:

                ${contextText}

                Always be concise and relevant to the user's query.`
            );

            // Create human message
            const humanMessage = new HumanMessage(message);



            console.log('[LangChainService] Sending request to LLM...');
            const response = await this.llm.call([systemMessage, humanMessage]);
            console.log('[LangChainService] Received response from LLM:', { responseLength: response.content.length });

            if (this.tracer) {
                await this.tracer.handleChainEnd(
                    { output: response.content },
                    Date.now().toString()
                );
            }

            return {
                response: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
                contexts,
            };
        } catch (error) {
            console.error('[LangChainService] Error processing message:', error);
            console.error('[LangChainService] Error stack:', error.stack);
            if (this.tracer) {
                await this.tracer.handleChainError(error, Date.now().toString());
            }
            throw error;
        }
    }
}
