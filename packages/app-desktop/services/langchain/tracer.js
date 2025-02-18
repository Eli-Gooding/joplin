"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleTracer = void 0;
const base_1 = require("@langchain/core/callbacks/base");
class ConsoleTracer extends base_1.BaseCallbackHandler {
    constructor() {
        super(...arguments);
        this.name = 'ConsoleTracer';
    }
    async handleChainStart(chain, inputs, _runId, _parentRunId, _tags, _metadata) {
        var _a;
        const chainPath = ((_a = chain.id) === null || _a === void 0 ? void 0 : _a.join('/')) || 'unknown';
        console.log(`Chain ${chainPath} (${chain.type}) started with inputs:`, inputs);
    }
    async handleChainEnd(outputs, _runId, _parentRunId, _tags) {
        console.log('Chain ended with outputs:', outputs);
    }
    async handleChainError(error, _runId, _parentRunId, _tags) {
        console.error('Chain error:', error);
    }
}
exports.ConsoleTracer = ConsoleTracer;
//# sourceMappingURL=tracer.js.map