"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextConfig = exports.llmConfig = exports.tracingConfig = exports.langsmithClient = void 0;
const langsmith_1 = require("langsmith");
const env_1 = require("./env");
const env = (0, env_1.getEnvVariables)();
try {
    (0, env_1.validateEnvVariables)(env);
}
catch (error) {
    console.error('[Config] Environment validation failed:', error.message);
    throw new Error('Please configure your OpenAI API key in Settings > LangChain.');
}
// Initialize LangSmith client and configure tracing
const initLangSmithClient = () => {
    if (!env.LANGCHAIN_API_KEY) {
        console.warn('[Config] LangSmith API key not found. Please set it in Settings > LangChain > LangSmith API Key to enable tracing.');
        return null;
    }
    if (!env.LANGCHAIN_PROJECT) {
        console.warn('[Config] LangSmith project name not found. Please set it in Settings > LangChain > LangSmith Project to enable tracing.');
        return null;
    }
    try {
        console.log('[Config] Initializing LangSmith client...', {
            endpoint: env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com',
            project: env.LANGCHAIN_PROJECT
        });
        const client = new langsmith_1.Client({
            apiUrl: env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com',
            apiKey: env.LANGCHAIN_API_KEY,
        });
        console.log('[Config] LangSmith client initialized successfully');
        return client;
    }
    catch (error) {
        console.error('[Config] Failed to initialize LangSmith client:', error);
        return null;
    }
};
exports.langsmithClient = initLangSmithClient();
exports.tracingConfig = {
    enabled: !!exports.langsmithClient,
    projectName: env.LANGCHAIN_PROJECT || 'joplin-chat',
    client: exports.langsmithClient,
};
// LLM Configuration
exports.llmConfig = {
    model: env.LANGCHAIN_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(env.LANGCHAIN_TEMPERATURE || '0.7'),
    maxTokens: parseInt(env.LANGCHAIN_MAX_TOKENS || '1000', 10),
    openAIApiKey: env.OPENAI_API_KEY,
    callbacks: [
        {
            handleLLMStart: async (llm, prompts) => {
                console.log('[LangChain Trace] LLM Start:', {
                    model: llm.model,
                    promptCount: prompts.length,
                });
            },
            handleLLMEnd: async (output) => {
                var _a;
                console.log('[LangChain Trace] LLM End:', {
                    tokenUsage: (_a = output.llmOutput) === null || _a === void 0 ? void 0 : _a.tokenUsage,
                });
            },
            handleLLMError: async (error) => {
                console.error('[LangChain Trace] LLM Error:', error);
            },
        },
    ],
};
// Context Extraction Configuration
exports.contextConfig = {
    chunkSize: 1500, // Size of each context chunk
    chunkOverlap: 300, // Overlap between chunks to maintain context
    maxChunks: 3, // Maximum number of context chunks to include
    minRelevanceScore: 0.3, // Lower threshold to include more relevant chunks
};
//# sourceMappingURL=config.js.map