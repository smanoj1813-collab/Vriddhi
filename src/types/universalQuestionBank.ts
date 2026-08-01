export interface QuestionMetadata {
  id: string;
  storagePath?: string;
  title: string;
  subject: string;
  type: string;
}

export interface QuestionStorageApi {
  downloadQuestion: (path: string) => Promise<any>;
}