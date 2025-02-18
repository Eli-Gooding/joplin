import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { tracingConfig, contextConfig } from './config';
import { ConsoleTracer } from './tracer';

export interface ExtractedContext {
    content: string;
    metadata: {
        source: string;
        startIndex: number;
        endIndex: number;
    };
}

export class ContextExtractor {
    private splitter: RecursiveCharacterTextSplitter;
    private tracer?: ConsoleTracer;

    constructor() {
        console.log('[ContextExtractor] Initializing...', {
            chunkSize: contextConfig.chunkSize,
            chunkOverlap: contextConfig.chunkOverlap,
            maxChunks: contextConfig.maxChunks
        });
        this.splitter = new RecursiveCharacterTextSplitter({
            chunkSize: contextConfig.chunkSize,
            chunkOverlap: contextConfig.chunkOverlap,
        });

        if (tracingConfig.enabled) {
            this.tracer = new ConsoleTracer();
        }
    }

    /**
     * Extract context from markdown content
     * @param content The markdown content to extract context from
     * @param query The query to use for context extraction
     * @returns Array of extracted context chunks
     */
    async extractContext(content: string, query: string): Promise<ExtractedContext[]> {
        if (this.tracer) {
            await this.tracer.handleChainStart(
                {
                    lc: 1,
                    type: 'not_implemented',
                    id: ['joplin', 'context_extraction']
                },
                { content_length: content.length, query },
                Date.now().toString()
            );
        }

        try {
            // Split the content into chunks
            console.log('[ContextExtractor] Splitting content into chunks...');
            const docs = await this.splitter.createDocuments([content]);
            console.log('[ContextExtractor] Created document chunks:', { numChunks: docs.length });

            // Score and filter chunks
            const scoredChunks = await Promise.all(docs.map(async (doc: Document) => {

                // For now, simulate scoring - we'll implement real scoring later
                const score = Math.random(); // TODO: Replace with actual relevance scoring

                return {
                    doc,
                    score,
                };
            }));

            // Sort by score and take top N chunks
            const topChunks = scoredChunks
                .filter(chunk => chunk.score >= contextConfig.minRelevanceScore)
                .sort((a, b) => b.score - a.score)
                .slice(0, contextConfig.maxChunks)
                .map(({ doc }) => ({
                    content: doc.pageContent,
                    metadata: {
                        source: 'current_note',
                        startIndex: doc.metadata.loc?.start || 0,
                        endIndex: doc.metadata.loc?.end || doc.pageContent.length,
                    },
                }));

            if (this.tracer) {
                await this.tracer.handleChainEnd(
                    {
                        num_chunks: topChunks.length
                    },
                    Date.now().toString()
                );
            }
            return topChunks;
        } catch (error) {
            console.error('[ContextExtractor] Error extracting context:', error);
            console.error('[ContextExtractor] Error stack:', error.stack);
            if (this.tracer) {
                await this.tracer.handleChainError(error, Date.now().toString());
            }
            throw error;
        }
    }
}
