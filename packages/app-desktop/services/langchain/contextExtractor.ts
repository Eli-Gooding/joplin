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

                // Score based on query term presence and position
                const queryTerms = query.toLowerCase().split(/\s+/);
                const content = doc.pageContent.toLowerCase();
                
                // Escape special regex characters and base score on term frequency
                let score = queryTerms.reduce((sum, term) => {
                    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const count = (content.match(new RegExp(escapedTerm, 'g')) || []).length;
                    return sum + (count > 0 ? 1 : 0);
                }, 0) / queryTerms.length;

                // Boost score if all terms are present
                if (queryTerms.every(term => content.includes(term))) {
                    score *= 1.5;
                }

                // Boost score if terms appear close together
                const firstTerm = queryTerms[0];
                const lastTerm = queryTerms[queryTerms.length - 1];
                const firstIndex = content.indexOf(firstTerm);
                const lastIndex = content.indexOf(lastTerm);
                if (firstIndex !== -1 && lastIndex !== -1) {
                    const distance = Math.abs(lastIndex - firstIndex);
                    if (distance < 100) { // Terms are close
                        score *= 1.2;
                    }
                }

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
