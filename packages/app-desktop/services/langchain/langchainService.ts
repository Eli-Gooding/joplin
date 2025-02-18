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
        this.contextExtractor = new ContextExtractor();

        if (tracingConfig.enabled) {
            this.tracer = new ConsoleTracer();
        }
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
            // Extract relevant context from the note
            const contexts = await this.contextExtractor.extractContext(noteContent, message);

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

            // Initialize LLM with tracing
            this.llm = new ChatOpenAI({
                modelName: llmConfig.model,
                temperature: llmConfig.temperature,
                maxTokens: llmConfig.maxTokens,
                callbacks: tracingConfig.enabled && this.tracer ? [this.tracer] : undefined,
            });

            // Get response from LLM
            const response = await this.llm.call([systemMessage, humanMessage]);

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
            console.error('Error processing message:', error);
            if (this.tracer) {
                await this.tracer.handleChainError(error, Date.now().toString());
            }
            throw error;
        }
    }
}
