import { Client } from 'langsmith';
import { getEnvVariables, validateEnvVariables } from './env';

const env = getEnvVariables();

try {
    validateEnvVariables(env);
} catch (error) {
    console.error('[Config] Environment validation failed:', error.message);
    throw new Error('Please configure your OpenAI API key in Settings > LangChain.');
}

// Initialize LangSmith client only if we have the required keys
export const langsmithClient = env.LANGCHAIN_API_KEY ? new Client({
    apiUrl: env.LANGCHAIN_ENDPOINT,
    apiKey: env.LANGCHAIN_API_KEY,
}) : null;

// Configure tracing
export const tracingConfig = {
    enabled: true,
    projectName: env.LANGCHAIN_PROJECT,
    client: langsmithClient,
};

// LLM Configuration
export const llmConfig = {
    model: env.LANGCHAIN_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(env.LANGCHAIN_TEMPERATURE || '0.7'),
    maxTokens: parseInt(env.LANGCHAIN_MAX_TOKENS || '1000', 10),
    openAIApiKey: env.OPENAI_API_KEY,
};

// Context Extraction Configuration
export const contextConfig = {
    chunkSize: 1000,                       // Size of each context chunk
    chunkOverlap: 200,                     // Overlap between chunks
    maxChunks: 5,                          // Maximum number of context chunks to include
    minRelevanceScore: 0.7,                // Minimum relevance score for context inclusion
};
