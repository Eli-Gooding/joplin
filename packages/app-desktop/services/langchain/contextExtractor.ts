import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { tracingConfig, contextConfig } from './config';
import { RunTracer } from 'langsmith';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { PromptTemplate } from 'langchain/prompts';

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
    private tracer?: RunTracer;

    constructor() {
        this.splitter = new RecursiveCharacterTextSplitter({
            chunkSize: contextConfig.chunkSize,
            chunkOverlap: contextConfig.chunkOverlap,
        });

        if (tracingConfig.enabled) {
            this.tracer = new RunTracer({
                projectName: tracingConfig.projectName,
                client: tracingConfig.client,
            });
        }
    }

    /**
     * Extract context from markdown content
     * @param content The markdown content to extract context from
     * @param query The query to use for context extraction
     * @returns Array of extracted context chunks
     */
    async extractContext(content: string, query: string): Promise<ExtractedContext[]> {
        const run = this.tracer?.createRun({
            name: 'context_extraction',
            extra: { content_length: content.length, query },
        });

        try {
            // Split the content into chunks
            const docs = await this.splitter.createDocuments([content]);

            // Create a prompt for relevance scoring
            const relevancePrompt = PromptTemplate.fromTemplate(
                'Rate the relevance of the following text chunk to the query on a scale of 0 to 1:\n\nQuery: {query}\n\nText chunk: {chunk}\n\nRelevance score:'
            );

            // Score and filter chunks
            const scoredChunks = await Promise.all(docs.map(async (doc: Document) => {
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

            await run?.end();
            return topChunks;
        } catch (error) {
            console.error('Error extracting context:', error);
            throw error;
        }
    }
}
