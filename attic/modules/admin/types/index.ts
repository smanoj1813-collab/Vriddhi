// src/modules/admin/types/index.ts
// Barrel file — only re-exports NON-CONFLICTING types.
// For conflicting types, import directly from the source file.

export * from './aiAgent';
export * from './aiQuestion';
export * from './assessment';
export * from './onboarding';
export * from './schedule';
export * from './attendance';   // ← add this

// ❌ REMOVED conflicting re-exports:
//    './paper', './questionBank', './universalQuestionBank'
//
// Import these directly instead:
//   import { Question, PaperSection } from './questionBank';
//   import { Paper, PaperConfig } from './paper';
//   import { QuestionContent, QuestionMetadata } from './universalQuestionBank';
