import { GoogleGenAI, Type } from "@google/genai";
import type { Snippet } from '../types';
import type { DocumentChunk } from './retrievalService';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts a JSON object or array from a string, tolerating markdown fences and other text.
 */
const extractJson = <T>(text: string): T | null => {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```|(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (!match) return null;
    const jsonString = match[1] || match[2];
    if (!jsonString) return null;
    try {
        return JSON.parse(jsonString.trim()) as T;
    } catch (e) {
        console.error("Failed to parse extracted JSON string:", e, "Original string:", jsonString);
        return null;
    }
};

const documentsPrompt = (query: string, documentContext: DocumentChunk[]) => `
  You are a highly precise data extraction tool. Your task is to extract verbatim text from internal documents that directly answers the user's query.

  **User Query:** "${query}"

  **Context from Documents:**
  ${documentContext.length > 0 ? documentContext.map(c => `--- START OF CONTEXT FROM ${c.source} ---\n${c.text}\n--- END OF CONTEXT FROM ${c.source} ---`).join('\n\n') : "No relevant context was found in the documents."}

  **CRITICAL INSTRUCTIONS:**
  1.  **Extract Verbatim:** You MUST extract the exact, word-for-word sentences or field definitions from the context that answer the query.
  2.  **DO NOT Paraphrase or Summarize:** Do not change the wording in any way. Your output must be identical to the source text.
  3.  **Cite Sources:** For each extract, you MUST cite the original source document.
  4.  **No Information Found:** If the context does not contain a direct answer, return an empty array.
  5.  **Output Format:** Your final output MUST be in the specified JSON format, with no other text.
`;

const finalSnippetSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            snippet: {
                type: Type.STRING,
                description: 'The verbatim, exact text extracted from the source.'
            },
            source: {
                type: Type.STRING,
                description: 'The original source document name or a single web URL.'
            }
        },
        required: ['snippet', 'source']
    }
};

const handleError = (error: unknown) => {
    console.error("An unexpected error occurred in Gemini Service:", error);
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('api key not valid')) {
            throw new Error("Invalid API Key: Please ensure your API key is correctly configured.");
        }
        if (msg.includes('429') || msg.includes('quota')) {
            throw new Error("API Rate Limit Exceeded: The service is temporarily unavailable due to high demand. Please try again in a moment.");
        }
        if (msg.includes('safety')) {
            throw new Error("Content Blocked: The query or document content was blocked by the API's safety filter. Please adjust your input.");
        }
        if (msg.includes('resource exhausted')) {
            throw new Error("API Quota Exceeded: You have exceeded your usage limit. Please check your plan and billing details.");
        }
    }
    // Generic fallback error
    throw new Error("AI Extraction Failed: The model could not generate a response. Please try again.");
}


export const generateAnswerFromDocuments = async (query: string, documentContext: DocumentChunk[]): Promise<Snippet[]> => {
    if (documentContext.length === 0) {
        return [];
    }

    try {
        const synthesisResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: documentsPrompt(query, documentContext),
            config: {
                responseMimeType: "application/json",
                responseSchema: finalSnippetSchema,
            }
        });

        const finalJson = extractJson<Snippet[]>(synthesisResponse.text);

        if (Array.isArray(finalJson)) {
            return finalJson;
        } else {
            console.error("Failed to parse document snippets JSON.", "Raw text:", synthesisResponse.text);
            return [];
        }

    } catch (error) {
        handleError(error);
        return []; // Should not be reached due to throw, but for type safety.
    }
};

export const generateAnswerFromWeb = async (query: string): Promise<Snippet[]> => {
    try {
        // Step 1: Get a grounded answer from web search
        const searchResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on a real-time web search from authoritative sources (gov, edu, org, official vendors), find text that directly answers this query: "${query}"`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const webAnswer = searchResponse.text;
        const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

        if (!webAnswer.trim()) {
            return [];
        }

        const sourcesText = groundingChunks
            .map(chunk => chunk.web ? `- "${chunk.web.title}" (${chunk.web.uri})` : '')
            .filter(Boolean)
            .join('\n');

        const extractionPrompt = `
            You are an expert at extracting verbatim information from official sources.
            Based on the following text, extract the exact sentences that answer the user's query.

            **Text to Analyze:**
            "${webAnswer}"

            **Sources:**
            ${sourcesText || "No sources provided."}

            **CRITICAL INSTRUCTIONS:**
            1.  **Extract Verbatim:** You MUST extract the exact, word-for-word sentences from the "Text to Analyze".
            2.  **DO NOT Paraphrase or Summarize:** The wording must be identical to the source.
            3.  **Cite Sources:** The 'source' field in your JSON output must be a URL from the "Sources" list.
            4.  **No Information Found:** If the text contains no direct answer, return an empty array.
            5.  **Output Format:** Your final output MUST be in the specified JSON format, with no other text.
        `;

        // Step 2: Extract structured snippets from the grounded answer
        const extractionResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: extractionPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: finalSnippetSchema,
            }
        });
        
        const extractedJson = extractJson<Snippet[]>(extractionResponse.text);

        if (Array.isArray(extractedJson)) {
            return extractedJson;
        } else {
            console.error("Failed to parse web snippets JSON.", "Raw text:", extractionResponse.text);
            return [];
        }
    } catch (error) {
        handleError(error);
        return [];
    }
};

const finalAnswerSystemInstruction = `You are a specialist AI assistant tasked with creating a business-ready answer for a professional audience.

### CRITICAL RULES:
1.  **Synthesize for Readability:** Your primary task is to synthesize the provided extracts into a single, coherent, and logical answer. You must restructure and paraphrase connecting language to ensure the final output is highly readable and makes business sense.
2.  **Preserve Core Terminology:** While you must restructure for flow, you MUST NOT alter or simplify the original terminology, key phrases, or specific data points from the extracts. The integrity of the source vocabulary is paramount.
3.  **Business-Ready Output:** The final answer must be a direct, professional response suitable for a business report. It should stand alone without needing any introductory phrases or prerequisites.
4.  **No Extraneous Information:** Do not include sources, citations, or any mention of where the information came from (e.g., "from the document," "according to the web search").
5.  **Direct and Focused:** Begin the answer by directly addressing the user's query. Avoid titles, headings, or conversational filler.
`;

const finalAnswerUserPrompt = (query: string, docSnippets: Snippet[], webSnippets: Snippet[]) => `
**User's Question:**
- ${query}

**Context from Document Extracts:**
${docSnippets.length > 0 ? docSnippets.map(s => `- "${s.snippet}"`).join('\n') : "- No relevant information was found in the documents."}

**Context from Web Extracts:**
${webSnippets.length > 0 ? webSnippets.map(s => `- "${s.snippet}"`).join('\n') : "- No relevant information was found from the web."}

**Your Task:**
Based *only* on the context provided above, generate a concise, synthesized answer. Follow the system instructions precisely to create a direct, to-the-point response.
`;


export const generateFinalAnswer = async (query: string, docSnippets: Snippet[], webSnippets: Snippet[]): Promise<string> => {
    if (docSnippets.length === 0 && webSnippets.length === 0) {
        return `No information was found in the provided documents or from the web for the question: "${query}"`;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: finalAnswerUserPrompt(query, docSnippets, webSnippets),
            config: {
                systemInstruction: finalAnswerSystemInstruction,
            }
        });
        return response.text.trim();
    } catch (error) {
        handleError(error);
        return "Failed to generate a final structured output due to an AI model error.";
    }
};