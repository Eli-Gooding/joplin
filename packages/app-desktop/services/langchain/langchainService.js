"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LangChainService = void 0;
const contextExtractor_1 = require("./contextExtractor");
const openai_1 = require("langchain/chat_models/openai");
const schema_1 = require("langchain/schema");
const config_1 = require("./config");
const langsmith_1 = require("langsmith");
class LangChainService {
    constructor() {
        this.contextExtractor = new contextExtractor_1.ContextExtractor();
        if (config_1.tracingConfig.enabled) {
            this.tracer = new langsmith_1.RunTracer({
                projectName: config_1.tracingConfig.projectName,
                client: config_1.tracingConfig.client,
            });
        }
    }
    /**
     * Process a chat message with the current note's context
     * @param message The user's message
     * @param noteContent The current note's content
     * @returns The processed response
     */
    async processMessage(message, noteContent) {
        var _a;
        const run = (_a = this.tracer) === null || _a === void 0 ? void 0 : _a.createRun({
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
            const systemMessage = new schema_1.SystemMessage(`You are a helpful AI assistant helping users interact with their notes. 
                Use the following context from the current note to inform your responses:

                ${contextText}

                Always be concise and relevant to the user's query.`);
            // Create human message
            const humanMessage = new schema_1.HumanMessage(message);
            // Initialize LLM with tracing
            this.llm = new openai_1.ChatOpenAI({
                modelName: config_1.llmConfig.model,
                temperature: config_1.llmConfig.temperature,
                maxTokens: config_1.llmConfig.maxTokens,
                callbacks: config_1.tracingConfig.enabled ? [this.tracer] : undefined,
            });
            // Get response from LLM
            const response = await this.llm.call([systemMessage, humanMessage]);
            await (run === null || run === void 0 ? void 0 : run.end());
            return {
                response: response.content,
                contexts,
            };
        }
        catch (error) {
            console.error('Error processing message:', error);
            throw error;
        }
    }
}
exports.LangChainService = LangChainService;
//# sourceMappingURL=langchainService.js.map