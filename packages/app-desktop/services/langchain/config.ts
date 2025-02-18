import { Client } from 'langsmith';
import { getEnvVariables, validateEnvVariables } from './env';

const env = getEnvVariables();
validateEnvVariables(env);

// Initialize LangSmith client
export const langsmithClient = new Client({
    apiUrl: env.LANGCHAIN_ENDPOINT,
    apiKey: env.LANGCHAIN_API_KEY,
});

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
};

// Context Extraction Configuration
export const contextConfig = {
    chunkSize: 1000,                       // Size of each context chunk
    chunkOverlap: 200,                     // Overlap between chunks
    maxChunks: 5,                          // Maximum number of context chunks to include
    minRelevanceScore: 0.7,                // Minimum relevance score for context inclusion
};
