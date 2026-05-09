export interface StoreSummary {
  name: string;
  displayName: string;
  activeDocumentsCount?: string;
  pendingDocumentsCount?: string;
  failedDocumentsCount?: string;
  createTime?: string;
}

export interface MetadataKV {
  key: string;
  value: string;
}

export interface CitationSource {
  index: number;
  title?: string;
  uri?: string;
  text?: string;
  pageNumber?: number;
  fileSearchStore?: string;
  customMetadata?: MetadataKV[];
}

export interface CitationSpan {
  startIndex: number;
  endIndex: number;
  chunkIndices: number[];
  confidenceScores?: number[];
}

export interface QueryResult {
  answer: string;
  sources: CitationSource[];
  spans: CitationSpan[];
}
