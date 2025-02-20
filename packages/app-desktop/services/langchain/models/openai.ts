import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage } from '@langchain/core/messages';
import { ModelAdapter, ModelCallOptions, ModelResponse } from './base';
import { llmConfig } from '../config';

export class OpenAIModelAdapter implements ModelAdapter {
    private model: ChatOpenAI | null = null;
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async initialize(): Promise<void> {
        if (this.model) return;

        this.model = new ChatOpenAI({
            modelName: llmConfig.model,
            temperature: llmConfig.temperature,
            maxTokens: llmConfig.maxTokens,
            openAIApiKey: this.apiKey,
        });
    }

    async call(messages: BaseMessage[], options?: ModelCallOptions): Promise<ModelResponse> {
        if (!this.model) {
            throw new Error('OpenAI model not initialized');
        }

        const response = await this.model.call(messages, {
            callbacks: options?.callbacks,
        });
        return {
            content: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
            metadata: response.additional_kwargs
        };
    }
}
