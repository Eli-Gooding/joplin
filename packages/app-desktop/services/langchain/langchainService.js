"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LangChainService = void 0;
const contextExtractor_1 = require("./contextExtractor");
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const config_1 = require("./config");
const tracer_1 = require("./tracer");
class LangChainService {
    constructor() {
        this.contextExtractor = new contextExtractor_1.ContextExtractor();
        if (config_1.tracingConfig.enabled) {
            this.tracer = new tracer_1.ConsoleTracer();
        }
    }
    /**
     * Process a chat message with the current note's context
     * @param message The user's message
     * @param noteContent The current note's content
     * @returns The processed response
     */
    async processMessage(message, noteContent) {
        if (this.tracer) {
            await this.tracer.handleChainStart({
                lc: 1,
                type: 'not_implemented',
                id: ['joplin', 'chat', 'process_message']
            }, { message_length: message.length }, Date.now().toString());
        }
        try {
            // Extract relevant context from the note
            const contexts = await this.contextExtractor.extractContext(noteContent, message);
            // Create system message with context
            const contextText = contexts
                .map(ctx => ctx.content)
                .join('\n\n');
            const systemMessage = new messages_1.SystemMessage(`You are a helpful AI assistant helping users interact with their notes. 
                Use the following context from the current note to inform your responses:

                ${contextText}

                Always be concise and relevant to the user's query.`);
            // Create human message
            const humanMessage = new messages_1.HumanMessage(message);
            // Initialize LLM with tracing
            this.llm = new openai_1.ChatOpenAI({
                modelName: config_1.llmConfig.model,
                temperature: config_1.llmConfig.temperature,
                maxTokens: config_1.llmConfig.maxTokens,
                callbacks: config_1.tracingConfig.enabled && this.tracer ? [this.tracer] : undefined,
            });
            // Get response from LLM
            const response = await this.llm.call([systemMessage, humanMessage]);
            if (this.tracer) {
                await this.tracer.handleChainEnd({ output: response.content }, Date.now().toString());
            }
            return {
                response: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
                contexts,
            };
        }
        catch (error) {
            console.error('Error processing message:', error);
            if (this.tracer) {
                await this.tracer.handleChainError(error, Date.now().toString());
            }
            throw error;
        }
    }
}
exports.LangChainService = LangChainService;
//# sourceMappingURL=langchainService.js.map