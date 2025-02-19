"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LangChainService = void 0;
const contextExtractor_1 = require("./contextExtractor");
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const config_1 = require("./config");
const console_1 = require("@langchain/core/tracers/console");
const callbacks_1 = require("langchain/callbacks");
class LangChainService {
    constructor() {
        // Core service state
        this.initialized = false;
        this.llm = null;
        // Handler management
        this.consoleTracer = null;
    }
    async initialize() {
        if (this.initialized)
            return;
        console.log('[LangChainService] Initializing service...');
        console.log('[LangChainService] Creating ContextExtractor...');
        this.contextExtractor = new contextExtractor_1.ContextExtractor();
        // Always use console tracing for debugging
        this.consoleTracer = new console_1.ConsoleCallbackHandler();
        // Initialize LangSmith tracing if configured
        if (config_1.tracingConfig.enabled && config_1.tracingConfig.client) {
            console.log('[LangChainService] LangSmith tracing enabled with project:', config_1.tracingConfig.projectName);
        }
        console.log('[LangChainService] Initializing ChatOpenAI with config:', {
            model: config_1.llmConfig.model,
            temperature: config_1.llmConfig.temperature,
            maxTokens: config_1.llmConfig.maxTokens,
            hasApiKey: !!config_1.llmConfig.openAIApiKey,
            hasLangSmithTracer: config_1.tracingConfig.enabled
        });
        // Initialize LLM with tracers
        const callbacks = [this.consoleTracer];
        if (config_1.tracingConfig.enabled && config_1.tracingConfig.client) {
            // The client implements the necessary callback interfaces
            callbacks.push(config_1.tracingConfig.client);
        }
        this.llm = new openai_1.ChatOpenAI({
            modelName: config_1.llmConfig.model,
            temperature: config_1.llmConfig.temperature,
            maxTokens: config_1.llmConfig.maxTokens,
            openAIApiKey: config_1.llmConfig.openAIApiKey,
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
    async processMessage(message, noteContent) {
        if (!this.initialized) {
            await this.initialize();
        }
        let tracer;
        if (config_1.tracingConfig.enabled && config_1.tracingConfig.client) {
            tracer = new callbacks_1.LangChainTracer({
                projectName: config_1.tracingConfig.projectName,
                client: config_1.tracingConfig.client,
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
            const systemMessage = new messages_1.SystemMessage(systemPrompt);
            // Create human message
            const humanMessage = new messages_1.HumanMessage(message);
            console.log('[LangChainService] Sending request to LLM...');
            const response = await this.llm.call([systemMessage, humanMessage], {
                callbacks: tracer ? [tracer] : undefined,
                tags: ['joplin-chat'],
                metadata: {
                    contextCount: contexts.length,
                    messageLength: message.length,
                    systemPromptLength: systemPrompt.length
                }
            });
            console.log('[LangChainService] Received response from LLM:', { responseLength: response.content.length });
            // Chain end is handled automatically
            return {
                response: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
                contexts,
            };
        }
        catch (error) {
            console.error('[LangChainService] Error processing message:', error);
            console.error('[LangChainService] Error stack:', error.stack);
            // Chain errors are handled automatically
            throw error;
        }
    }
}
exports.LangChainService = LangChainService;
//# sourceMappingURL=langchainService.js.map