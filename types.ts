export interface Snippet {
  snippet: string;
  source: string;
}

export interface AppResults {
  synthesizedSnippets: Snippet[];
  webSnippets: Snippet[];
  finalAnswer: string;
}
