import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { ChainValues } from '@langchain/core/utils/types';
import { Serialized } from '@langchain/core/load/serializable';

export class ConsoleTracer extends BaseCallbackHandler {
    name = 'ConsoleTracer';

    async handleChainStart(
        chain: Serialized,
        inputs: ChainValues,
        _runId: string,
        _parentRunId?: string,
        _tags?: string[],
        _metadata?: Record<string, unknown>,
    ): Promise<void> {
        const chainPath = chain.id?.join('/') || 'unknown';
        console.log(`Chain ${chainPath} (${chain.type}) started with inputs:`, inputs);
    }

    async handleChainEnd(
        outputs: ChainValues,
        _runId: string,
        _parentRunId?: string,
        _tags?: string[],
    ): Promise<void> {
        console.log('Chain ended with outputs:', outputs);
    }

    async handleChainError(
        error: Error,
        _runId: string,
        _parentRunId?: string,
        _tags?: string[],
    ): Promise<void> {
        console.error('Chain error:', error);
    }
}
