import { Client } from 'langsmith';
import { getEnvVariables, validateEnvVariables } from './env';

const env = getEnvVariables();

try {
    validateEnvVariables(env);
} catch (error) {
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
        const client = new Client({
            apiUrl: env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com',
            apiKey: env.LANGCHAIN_API_KEY,
        });
        console.log('[Config] LangSmith client initialized successfully');
        return client;
    } catch (error) {
        console.error('[Config] Failed to initialize LangSmith client:', error);
        return null;
    }
};

export const langsmithClient = initLangSmithClient();

export const tracingConfig = {
    enabled: !!langsmithClient,
    projectName: env.LANGCHAIN_PROJECT || 'joplin-chat',
    client: langsmithClient,
};

// LLM Configuration
export const llmConfig = {
    model: env.LANGCHAIN_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(env.LANGCHAIN_TEMPERATURE || '0.7'),
    maxTokens: parseInt(env.LANGCHAIN_MAX_TOKENS || '1000', 10),
    openAIApiKey: env.OPENAI_API_KEY,
    callbacks: [
        {
            handleLLMStart: async (llm: any, prompts: string[]) => {
                console.log('[LangChain Trace] LLM Start:', {
                    model: llm.model,
                    promptCount: prompts.length,
                });
            },
            handleLLMEnd: async (output: any) => {
                console.log('[LangChain Trace] LLM End:', {
                    tokenUsage: output.llmOutput?.tokenUsage,
                });
            },
            handleLLMError: async (error: Error) => {
                console.error('[LangChain Trace] LLM Error:', error);
            },
        },
    ],
};

// Context Extraction Configuration
export const contextConfig = {
    chunkSize: 1500,                       // Size of each context chunk
    chunkOverlap: 300,                     // Overlap between chunks to maintain context
    maxChunks: 3,                          // Maximum number of context chunks to include
    minRelevanceScore: 0.3,                // Lower threshold to include more relevant chunks
};
