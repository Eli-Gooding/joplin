import { BaseMessage } from '@langchain/core/messages';
import { ModelAdapter, ModelCallOptions, ModelResponse } from './base';

export class LlamaModelAdapter implements ModelAdapter {
    private initialized: boolean = false;

    constructor(private readonly endpoint: string) {}

    async initialize(): Promise<void> {
        if (this.initialized) return;
        
        // TODO: Add any necessary initialization for Llama
        // This might include:
        // 1. Validating the endpoint is accessible
        // 2. Loading any required configurations
        // 3. Setting up connection pools or other resources
        
        this.initialized = true;
    }

    async call(messages: BaseMessage[], options?: ModelCallOptions): Promise<ModelResponse> {
        if (!this.initialized) {
            throw new Error('Llama model not initialized');
        }

        try {
            // Convert messages to a single prompt string
            const prompt = messages.map(msg => {
                const role = msg._getType();
                const content = msg.content;
                if (role === 'system') {
                    return `System: ${content}\n`;
                } else if (role === 'human') {
                    return `Human: ${content}\n`;
                } else if (role === 'ai') {
                    return `Assistant: ${content}\n`;
                }
                return `${content}\n`;
            }).join('');

            // Make request to Ollama API
            const response = await fetch(`${this.endpoint}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama2',  // Default to llama2, could make this configurable
                    prompt: prompt,
                    stream: false,  // Get complete response
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Ollama API error: ${error}`);
            }

            const data = await response.json();
            return {
                content: data.response,
                metadata: {
                    ...data,
                    response: undefined,  // Remove response from metadata since it's already in content
                },
            };
        } catch (error) {
            console.error('[LlamaModelAdapter] Error calling Ollama API:', error);
            throw error;
        }
    }
}
