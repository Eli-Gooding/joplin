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
// Initialize LangSmith client only if we have the required keys
exports.langsmithClient = env.LANGCHAIN_API_KEY ? new langsmith_1.Client({
    apiUrl: env.LANGCHAIN_ENDPOINT,
    apiKey: env.LANGCHAIN_API_KEY,
}) : null;
// Configure tracing
exports.tracingConfig = {
    enabled: true,
    projectName: env.LANGCHAIN_PROJECT,
    client: exports.langsmithClient,
};
// LLM Configuration
exports.llmConfig = {
    model: env.LANGCHAIN_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(env.LANGCHAIN_TEMPERATURE || '0.7'),
    maxTokens: parseInt(env.LANGCHAIN_MAX_TOKENS || '1000', 10),
    openAIApiKey: env.OPENAI_API_KEY,
};
// Context Extraction Configuration
exports.contextConfig = {
    chunkSize: 1000, // Size of each context chunk
    chunkOverlap: 200, // Overlap between chunks
    maxChunks: 5, // Maximum number of context chunks to include
    minRelevanceScore: 0.7, // Minimum relevance score for context inclusion
};
//# sourceMappingURL=config.js.map