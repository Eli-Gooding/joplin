"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LangChainService = void 0;
const contextExtractor_1 = require("./contextExtractor");
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const config_1 = require("./config");
const console_1 = require("@langchain/core/tracers/console");
const callbacks_1 = require("langchain/callbacks");
const diffGenerator_1 = require("./diffGenerator");
class LangChainService {
    constructor() {
        // Core service state
        this.initialized = false;
        this.contextExtractor = new contextExtractor_1.ContextExtractor();
        this.diffGenerator = new diffGenerator_1.DiffGenerator();
        this.llm = null;
        // Handler management
        this.consoleTracer = null;
    }
    /**
     * Format a diff operation for preview in the chat
     */
    formatDiffPreview(diff) {
        let preview = '';
        for (const range of diff.ranges) {
            if (range.originalText && range.newText) {
                preview += '```diff\n';
                preview += '- ' + range.originalText.split('\n').join('\n- ');
                preview += '+ ' + range.newText.split('\n').join('\n+ ');
                preview += '```\n';
            }
            else if (range.originalText) {
                preview += '```diff\n';
                preview += '- ' + range.originalText.split('\n').join('\n- ');
                preview += '```\n';
            }
            else if (range.newText) {
                preview += '```diff\n';
                preview += '+ ' + range.newText.split('\n').join('\n+ ');
                preview += '```\n';
            }
        }
        return preview;
    }
    async initialize() {
        if (this.initialized)
            return;
        console.log('[LangChainService] Initializing service...');
        console.log('[LangChainService] Service components already initialized...');
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
    async processMessage(message, noteContent, noteId) {
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
            systemPrompt += '\n\nYou can suggest edits to the note by starting your response with "[EDIT]" followed by the complete new content for the note. Otherwise, be concise and relevant to the user\'s query.';
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
            const responseContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
            // Check if this is an edit suggestion
            let suggestedEdit;
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