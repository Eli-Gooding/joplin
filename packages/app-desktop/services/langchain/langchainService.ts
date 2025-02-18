import { ContextExtractor, ExtractedContext } from './contextExtractor';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanMessage, SystemMessage } from 'langchain/schema';
import { llmConfig, tracingConfig } from './config';
import { RunTracer } from 'langsmith';

export class LangChainService {
    private contextExtractor: ContextExtractor;
    private tracer?: RunTracer;
    private llm: ChatOpenAI;

    constructor() {
        this.contextExtractor = new ContextExtractor();

        if (tracingConfig.enabled) {
            this.tracer = new RunTracer({
                projectName: tracingConfig.projectName,
                client: tracingConfig.client,
            });
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
        const run = this.tracer?.createRun({
            name: 'process_message',
            extra: { message_length: message.length },
        });

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
                callbacks: tracingConfig.enabled ? [this.tracer] : undefined,
            });

            // Get response from LLM
            const response = await this.llm.call([systemMessage, humanMessage]);

            await run?.end();

            return {
                response: response.content,
                contexts,
            };
        } catch (error) {
            console.error('Error processing message:', error);
            throw error;
        }
    }
}
