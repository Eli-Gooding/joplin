import { BaseMessage } from '@langchain/core/messages';
import { Callbacks } from '@langchain/core/callbacks/manager';

export interface ModelCallOptions {
    callbacks?: Callbacks;
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface ModelResponse {
    content: string;
    metadata?: Record<string, any>;
}

export interface ModelAdapter {
    initialize(): Promise<void>;
    call(messages: BaseMessage[], options?: ModelCallOptions): Promise<ModelResponse>;
}
