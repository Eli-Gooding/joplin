import Setting from '@joplin/lib/models/Setting';

import { AppType, SettingSectionSource } from '@joplin/lib/models/settings/types';

export async function registerSettings() {
    // Register the section
    await Setting.registerSection('langchain', SettingSectionSource.Default, {
        label: 'LangChain',
        iconName: 'fas fa-robot',
        description: 'LangChain integration settings for AI chat functionality.',
    });

    // Register each setting individually
        await Setting.registerSetting('openaiApiKey', {
        value: '',
        type: Setting.TYPE_STRING,
        section: 'langchain',
        public: true,
        label: () => 'OpenAI API Key',
        description: (_appType: AppType) => 'Your OpenAI API key for chat functionality',
    });
    await Setting.registerSetting('langchainEndpoint', {
        value: 'https://api.smith.langchain.com',
        type: Setting.TYPE_STRING,
        section: 'langchain',
        public: true,
        label: () => 'LangSmith Endpoint',
        description: (_appType: AppType) => 'LangSmith API endpoint for tracing (optional)',
    });
    await Setting.registerSetting('langchainApiKey', {
        value: '',
        type: Setting.TYPE_STRING,
        section: 'langchain',
        public: true,
        label: () => 'LangSmith API Key',
        description: (_appType: AppType) => 'Your LangSmith API key for tracing (optional)',
    });
    await Setting.registerSetting('langchainProject', {
        value: 'joplin-chat',
        type: Setting.TYPE_STRING,
        section: 'langchain',
        public: true,
        label: () => 'LangSmith Project',
        description: (_appType: AppType) => 'Project name in LangSmith (optional)',
    });
    await Setting.registerSetting('langchainModel', {
        value: 'gpt-3.5-turbo',
        type: Setting.TYPE_STRING,
        section: 'langchain',
        public: true,
        label: () => 'LLM Model',
        description: (_appType: AppType) => 'The model to use for chat (e.g., gpt-3.5-turbo, gpt-4)',
    });
    await Setting.registerSetting('langchainTemperature', {
        value: '0.7',
        type: Setting.TYPE_STRING,
        section: 'langchain',
        public: true,
        label: () => 'Temperature',
        description: (_appType: AppType) => 'Controls response randomness (0.0-1.0)',
    });
    await Setting.registerSetting('langchainMaxTokens', {
        value: '1000',
        type: Setting.TYPE_STRING,
        section: 'langchain',
        public: true,
        label: () => 'Max Tokens',
        description: (_appType: AppType) => 'Maximum tokens per response',
    });
}
