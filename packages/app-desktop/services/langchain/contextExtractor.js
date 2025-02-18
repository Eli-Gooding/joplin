"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextExtractor = void 0;
const text_splitter_1 = require("langchain/text_splitter");
const config_1 = require("./config");
const langsmith_1 = require("langsmith");
const prompts_1 = require("langchain/prompts");
class ContextExtractor {
    constructor() {
        this.splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
            chunkSize: config_1.contextConfig.chunkSize,
            chunkOverlap: config_1.contextConfig.chunkOverlap,
        });
        if (config_1.tracingConfig.enabled) {
            this.tracer = new langsmith_1.RunTracer({
                projectName: config_1.tracingConfig.projectName,
                client: config_1.tracingConfig.client,
            });
        }
    }
    /**
     * Extract context from markdown content
     * @param content The markdown content to extract context from
     * @param query The query to use for context extraction
     * @returns Array of extracted context chunks
     */
    async extractContext(content, query) {
        var _a;
        const run = (_a = this.tracer) === null || _a === void 0 ? void 0 : _a.createRun({
            name: 'context_extraction',
            extra: { content_length: content.length, query },
        });
        try {
            // Split the content into chunks
            const docs = await this.splitter.createDocuments([content]);
            // Create a prompt for relevance scoring
            const relevancePrompt = prompts_1.PromptTemplate.fromTemplate('Rate the relevance of the following text chunk to the query on a scale of 0 to 1:\n\nQuery: {query}\n\nText chunk: {chunk}\n\nRelevance score:');
            // Score and filter chunks
            const scoredChunks = await Promise.all(docs.map(async (doc) => {
                const promptResult = await relevancePrompt.format({
                    query,
                    chunk: doc.pageContent,
                });
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
            await (run === null || run === void 0 ? void 0 : run.end());
            return topChunks;
        }
        catch (error) {
            console.error('Error extracting context:', error);
            throw error;
        }
    }
}
exports.ContextExtractor = ContextExtractor;
//# sourceMappingURL=contextExtractor.js.map