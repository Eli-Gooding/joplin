"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextExtractor = void 0;
const text_splitter_1 = require("langchain/text_splitter");
const config_1 = require("./config");
const tracer_1 = require("./tracer");
class ContextExtractor {
    constructor() {
        this.splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
            chunkSize: config_1.contextConfig.chunkSize,
            chunkOverlap: config_1.contextConfig.chunkOverlap,
        });
        if (config_1.tracingConfig.enabled) {
            this.tracer = new tracer_1.ConsoleTracer();
        }
    }
    /**
     * Extract context from markdown content
     * @param content The markdown content to extract context from
     * @param query The query to use for context extraction
     * @returns Array of extracted context chunks
     */
    async extractContext(content, query) {
        if (this.tracer) {
            await this.tracer.handleChainStart({
                lc: 1,
                type: 'not_implemented',
                id: ['joplin', 'context_extraction']
            }, { content_length: content.length, query }, Date.now().toString());
        }
        try {
            // Split the content into chunks
            const docs = await this.splitter.createDocuments([content]);
            // Score and filter chunks
            const scoredChunks = await Promise.all(docs.map(async (doc) => {
                // For now, simulate scoring - we'll implement real scoring later
                const score = Math.random(); // TODO: Replace with actual relevance scoring
                return {
                    doc,
                    score,
                };
            }));
            // Sort by score and take top N chunks
            const topChunks = scoredChunks
                .filter(chunk => chunk.score >= config_1.contextConfig.minRelevanceScore)
                .sort((a, b) => b.score - a.score)
                .slice(0, config_1.contextConfig.maxChunks)
                .map(({ doc }) => {
                var _a, _b;
                return ({
                    content: doc.pageContent,
                    metadata: {
                        source: 'current_note',
                        startIndex: ((_a = doc.metadata.loc) === null || _a === void 0 ? void 0 : _a.start) || 0,
                        endIndex: ((_b = doc.metadata.loc) === null || _b === void 0 ? void 0 : _b.end) || doc.pageContent.length,
                    },
                });
            });
            if (this.tracer) {
                await this.tracer.handleChainEnd({
                    num_chunks: topChunks.length
                }, Date.now().toString());
            }
            return topChunks;
        }
        catch (error) {
            console.error('Error extracting context:', error);
            if (this.tracer) {
                await this.tracer.handleChainError(error, Date.now().toString());
            }
            throw error;
        }
    }
}
exports.ContextExtractor = ContextExtractor;
//# sourceMappingURL=contextExtractor.js.map