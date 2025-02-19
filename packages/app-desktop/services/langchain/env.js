"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvVariables = exports.getEnvVariables = void 0;
const Setting_1 = require("@joplin/lib/models/Setting");
function getEnvVariables() {
    // Debug: Log all settings
    const settings = {
        LANGCHAIN_ENDPOINT: Setting_1.default.value('langchainEndpoint'),
        LANGCHAIN_API_KEY: Setting_1.default.value('langchainApiKey'),
        LANGCHAIN_PROJECT: Setting_1.default.value('langchainProject'),
        LANGCHAIN_MODEL: Setting_1.default.value('langchainModel'),
        LANGCHAIN_TEMPERATURE: Setting_1.default.value('langchainTemperature'),
        LANGCHAIN_MAX_TOKENS: Setting_1.default.value('langchainMaxTokens'),
        LANGCHAIN_TRACING_V2: Setting_1.default.value('langchainApiKey') ? 'true' : undefined, // Enable tracing only if we have a LangSmith API key
        OPENAI_API_KEY: Setting_1.default.value('openaiApiKey'),
    };
    console.log('[Config] Current settings:', Object.assign(Object.assign({}, settings), { OPENAI_API_KEY: settings.OPENAI_API_KEY ? '***' : undefined, LANGCHAIN_API_KEY: settings.LANGCHAIN_API_KEY ? '***' : undefined }));
    return settings;
}
exports.getEnvVariables = getEnvVariables;
function validateEnvVariables(env) {
    var _a;
    // First check OpenAI API key as it's critical
    if (!env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required for the chat service to function.');
    }
    // Then check LangSmith variables if tracing is needed
    const langsmithVars = ['LANGCHAIN_ENDPOINT', 'LANGCHAIN_API_KEY', 'LANGCHAIN_PROJECT'];
    const missingLangsmith = langsmithVars.filter(varName => !env[varName]);
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
    if (!((_a = env.OPENAI_API_KEY) === null || _a === void 0 ? void 0 : _a.match(/^sk-[a-zA-Z0-9-]+$/))) {
        throw new Error('Invalid OPENAI_API_KEY format. It should start with "sk-" followed by alphanumeric characters.');
    }
    // Validate endpoint
    if (env.LANGCHAIN_ENDPOINT !== 'https://api.smith.langchain.com') {
        throw new Error('LANGCHAIN_ENDPOINT should be set to "https://api.smith.langchain.com" for LangSmith tracing.');
    }
}
exports.validateEnvVariables = validateEnvVariables;
//# sourceMappingURL=env.js.map