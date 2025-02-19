export interface LangChainEnvVariables {
    LANGCHAIN_ENDPOINT?: string;
    LANGCHAIN_API_KEY?: string;
    LANGCHAIN_PROJECT?: string;
    LANGCHAIN_MODEL?: string;
    LANGCHAIN_TEMPERATURE?: string;
    LANGCHAIN_MAX_TOKENS?: string;
    LANGCHAIN_TRACING_V2?: string;
    OPENAI_API_KEY?: string;
}

import Setting from '@joplin/lib/models/Setting';

export function getEnvVariables(): LangChainEnvVariables {
    // Debug: Log all settings
    const settings = {
        LANGCHAIN_ENDPOINT: Setting.value('langchainEndpoint'),
        LANGCHAIN_API_KEY: Setting.value('langchainApiKey'),
        LANGCHAIN_PROJECT: Setting.value('langchainProject'),
        LANGCHAIN_MODEL: Setting.value('langchainModel'),
        LANGCHAIN_TEMPERATURE: Setting.value('langchainTemperature'),
        LANGCHAIN_MAX_TOKENS: Setting.value('langchainMaxTokens'),
        LANGCHAIN_TRACING_V2: Setting.value('langchainApiKey') ? 'true' : undefined,  // Enable tracing only if we have a LangSmith API key
        OPENAI_API_KEY: Setting.value('openaiApiKey'),
    };
    
    console.log('[Config] Current settings:', {
        ...settings,
        OPENAI_API_KEY: settings.OPENAI_API_KEY ? '***' : undefined,
        LANGCHAIN_API_KEY: settings.LANGCHAIN_API_KEY ? '***' : undefined,
    });

    return settings;
}

export function validateEnvVariables(env: LangChainEnvVariables): void {
    // First check OpenAI API key as it's critical
    if (!env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required for the chat service to function.');
    }

    // Then check LangSmith variables if tracing is needed
    const langsmithVars = ['LANGCHAIN_ENDPOINT', 'LANGCHAIN_API_KEY', 'LANGCHAIN_PROJECT'];
    const missingLangsmith = langsmithVars.filter(varName => !env[varName as keyof LangChainEnvVariables]);
    
    if (missingLangsmith.length > 0) {
        console.warn('[Config] Missing LangSmith variables:', missingLangsmith.join(', '), '- Tracing will be disabled');
    }

    // Validate LangSmith API key format
    if (env.LANGCHAIN_API_KEY) {
        console.log('[Config] Testing LangSmith key format:', env.LANGCHAIN_API_KEY);
        // Test each part of the key separately
        const parts = env.LANGCHAIN_API_KEY.split('_');
        console.log('[Config] Key parts:', parts);

        // More permissive regex that allows any format starting with ls or lsv2
        const regex = /^(ls|lsv2)_.*$/;
        const isValid = regex.test(env.LANGCHAIN_API_KEY);
        console.log('[Config] Key format valid?', isValid);
        
        if (!isValid) {
            throw new Error(`Invalid LANGCHAIN_API_KEY format: ${env.LANGCHAIN_API_KEY}\nKey should start with 'ls_' or 'lsv2_'`);
        }
    }

    // Validate OpenAI API key format
    if (!env.OPENAI_API_KEY?.match(/^sk-[a-zA-Z0-9-]+$/)) {
        throw new Error('Invalid OPENAI_API_KEY format. It should start with "sk-" followed by alphanumeric characters.');
    }

    // Validate endpoint
    if (env.LANGCHAIN_ENDPOINT !== 'https://api.smith.langchain.com') {
        throw new Error('LANGCHAIN_ENDPOINT should be set to "https://api.smith.langchain.com" for LangSmith tracing.');
    }
}
