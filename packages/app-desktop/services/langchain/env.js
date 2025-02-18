"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvVariables = exports.getEnvVariables = void 0;
function getEnvVariables() {
    return {
        LANGCHAIN_ENDPOINT: process.env.LANGCHAIN_ENDPOINT,
        LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY,
        LANGCHAIN_PROJECT: process.env.LANGCHAIN_PROJECT,
        LANGCHAIN_MODEL: process.env.LANGCHAIN_MODEL,
        LANGCHAIN_TEMPERATURE: process.env.LANGCHAIN_TEMPERATURE,
        LANGCHAIN_MAX_TOKENS: process.env.LANGCHAIN_MAX_TOKENS,
    };
}
exports.getEnvVariables = getEnvVariables;
function validateEnvVariables(env) {
    var _a;
    // Check for missing variables
    const requiredVars = ['LANGCHAIN_ENDPOINT', 'LANGCHAIN_API_KEY', 'LANGCHAIN_PROJECT'];
    const missingVars = requiredVars.filter(varName => !env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    // Validate API key format
    if (!((_a = env.LANGCHAIN_API_KEY) === null || _a === void 0 ? void 0 : _a.match(/^ls__[a-zA-Z0-9]+$/))) {
        throw new Error('Invalid LANGCHAIN_API_KEY format. It should start with "ls__" followed by alphanumeric characters.');
    }
    // Validate endpoint
    if (env.LANGCHAIN_ENDPOINT !== 'https://api.smith.langchain.com') {
        throw new Error('LANGCHAIN_ENDPOINT should be set to "https://api.smith.langchain.com" for LangSmith tracing.');
    }
}
exports.validateEnvVariables = validateEnvVariables;
//# sourceMappingURL=env.js.map