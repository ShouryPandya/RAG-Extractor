import { ai } from './geminiService';

// --- Helper Functions for Vector Math ---

const dotProduct = (vecA: number[], vecB: number[]): number => {
    let product = 0;
    for (let i = 0; i < vecA.length; i++) {
        product += vecA[i] * vecB[i];
    }
    return product;
};

const magnitude = (vec: number[]): number => {
    let sum = 0;
    for (let i = 0; i < vec.length; i++) {
        sum += vec[i] * vec[i];
    }
    return Math.sqrt(sum);
};

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
        return 0;
    }
    const dot = dotProduct(vecA, vecB);
    const magA = magnitude(vecA);
    const magB = magnitude(vecB);
    if (magA === 0 || magB === 0) {
        return 0;
    }
    return dot / (magA * magB);
};


// --- Interfaces ---

export interface DocumentChunk {
    source: string;
    text: string;
    embedding: number[];
}

// --- Text Chunking Logic ---

const chunkText = (text: string, chunkSize = 512, overlap = 50): string[] => {
    const chunks: string[] = [];
    if (!text) return chunks;
    let startIndex = 0;
    while (startIndex < text.length) {
        const endIndex = Math.min(startIndex + chunkSize, text.length);
        const currentChunk = text.slice(startIndex, endIndex);
        chunks.push(currentChunk);
        if (endIndex === text.length) break;
        startIndex += chunkSize - overlap;
    }
    return chunks;
};

// --- Main Service Class ---

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_BATCH_SIZE = 100; // API limit is often 100

export class RetrievalService {
    private chunks: DocumentChunk[] = [];
    // Fix: Removed the `GenerativeModel` type import, the `embeddingModel` property, and the constructor.
    // The previous implementation used a deprecated pattern of initializing a model instance (`ai.getGenerativeModel`).
    // The correct approach, as per the SDK guidelines, is to call API methods like `embedContent` directly on the `ai.models` object.

    async processDocuments(files: { name: string; content: string }[]): Promise<{ failedFiles: string[] }> {
        // Clear previous documents before processing new ones.
        this.chunks = [];
        const failedFiles: string[] = [];
        
        const allTextChunks: { source: string; text: string }[] = [];

        // 1. Split all file content into smaller, manageable chunks
        for (const file of files) {
            try {
                const textChunks = chunkText(file.content);
                textChunks.forEach(text => {
                    allTextChunks.push({ source: file.name, text });
                });
            } catch (err) {
                console.error(`Failed to chunk file "${file.name}":`, err);
                failedFiles.push(file.name);
            }
        }
        
        if (allTextChunks.length === 0) {
             return { failedFiles };
        }

        try {
            // --- OPTIMIZATION: Process embeddings in concurrent batches ---
            const newChunks: DocumentChunk[] = [];
            const embeddingPromises = [];

            for (let i = 0; i < allTextChunks.length; i += EMBEDDING_BATCH_SIZE) {
                const batch = allTextChunks.slice(i, i + EMBEDDING_BATCH_SIZE);
                const batchTexts = batch.map(chunk => chunk.text);
                
                // Fix: Corrected typo from `embedContents` to `embedContent` for batch embedding.
                const promise = ai.models.embedContent({
                    model: EMBEDDING_MODEL,
                    contents: batchTexts,
                }).then(result => {
                    result.embeddings.forEach((embedding, index) => {
                        newChunks.push({
                            ...batch[index],
                            embedding: embedding.values,
                        });
                    });
                }).catch(err => {
                    console.warn(`A batch of embeddings failed. Skipping ${batch.length} chunks.`, err);
                    // Optionally, you could add the source files of the failed batch to failedFiles here.
                });
                
                embeddingPromises.push(promise);
            }

            await Promise.allSettled(embeddingPromises);
            this.chunks = newChunks;
            // --- END OPTIMIZATION ---

        } catch (err) {
             // This outer catch is for catastrophic failures, e.g., API key issues.
             console.error("A critical error occurred during document embedding:", err);
             const processedFileNames = new Set(this.chunks.map(c => c.source));
             const newFailedFiles = files.filter(f => !processedFileNames.has(f.name)).map(f => f.name);
             failedFiles.push(...newFailedFiles);
             throw new Error("Could not create document embeddings via API. Please try again.");
        }

        return { failedFiles: [...new Set(failedFiles)] }; // Return unique failed file names
    }

    async search(query: string, topK = 5): Promise<DocumentChunk[]> {
        if (this.chunks.length === 0) {
            return [];
        }

        try {
            // 1. Embed the user's search query using the initialized model instance
            // Fix: Replaced deprecated `this.embeddingModel.embedContent` with the correct API call `ai.models.embedContent`.
            // Fix: Corrected `embedContent` parameter from 'content' to 'contents' and response access from 'embedding.values' to 'embeddings[0].values'.
            const result = await ai.models.embedContent({ model: EMBEDDING_MODEL, contents: query });
            const queryEmbedding = result.embeddings[0].values;

            // 2. Calculate the cosine similarity between the query and each document chunk
            const scoredChunks = this.chunks.map(chunk => {
                if (!chunk.embedding || chunk.embedding.length === 0) {
                    return { ...chunk, score: -1 };
                }
                const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
                return { ...chunk, score: similarity };
            });
    
            // 3. Sort chunks by relevance and return the top K results
            scoredChunks.sort((a, b) => b.score - a.score);
            return scoredChunks.slice(0, topK);

        } catch (err) {
            console.error("Failed to embed search query:", err);
            throw new Error("Could not perform search via API. Please try again.");
        }
    }
}