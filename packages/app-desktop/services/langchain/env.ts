export interface LangChainEnvVariables {
    LANGCHAIN_ENDPOINT?: string;
    LANGCHAIN_API_KEY?: string;
    LANGCHAIN_PROJECT?: string;
    LANGCHAIN_MODEL?: string;
    LANGCHAIN_TEMPERATURE?: string;
    LANGCHAIN_MAX_TOKENS?: string;
}

export function getEnvVariables(): LangChainEnvVariables {
    return {
        LANGCHAIN_ENDPOINT: process.env.LANGCHAIN_ENDPOINT,
        LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY,
        LANGCHAIN_PROJECT: process.env.LANGCHAIN_PROJECT,
        LANGCHAIN_MODEL: process.env.LANGCHAIN_MODEL,
        LANGCHAIN_TEMPERATURE: process.env.LANGCHAIN_TEMPERATURE,
        LANGCHAIN_MAX_TOKENS: process.env.LANGCHAIN_MAX_TOKENS,
    };
}

export function validateEnvVariables(env: LangChainEnvVariables): void {
    // Check for missing variables
    const requiredVars = ['LANGCHAIN_ENDPOINT', 'LANGCHAIN_API_KEY', 'LANGCHAIN_PROJECT'];
    const missingVars = requiredVars.filter(varName => !env[varName as keyof LangChainEnvVariables]);
    
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate API key format
    if (!env.LANGCHAIN_API_KEY?.match(/^ls__[a-zA-Z0-9]+$/)) {
        throw new Error('Invalid LANGCHAIN_API_KEY format. It should start with "ls__" followed by alphanumeric characters.');
    }

    // Validate endpoint
    if (env.LANGCHAIN_ENDPOINT !== 'https://api.smith.langchain.com') {
        throw new Error('LANGCHAIN_ENDPOINT should be set to "https://api.smith.langchain.com" for LangSmith tracing.');
    }
}
