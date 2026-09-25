// Stand-in for the Prep API client, so the public /prep views mount for real
// in jsdom without a Cloud Function behind them.
//
// Fixtures come from `globalThis.__RC_PREP`:
//   { subjects: PrepSubject[], companies: PrepCompany[], topics?, topic?, questions? }
// Every call is recorded on `globalThis.__RC_PREP_CALLS` so a test can assert
// the hub still renders from ONE subjects + ONE companies request.
function data(): any {
  return (globalThis as any).__RC_PREP ?? {};
}

// Resolved per call (not captured at import) so a test can reset the list
// between mounts by replacing the global.
function record(fn: string, params?: any) {
  const g = globalThis as any;
  g.__RC_PREP_CALLS = g.__RC_PREP_CALLS ?? [];
  g.__RC_PREP_CALLS.push({ fn, params });
}

export function __resetPrepCalls() {
  (globalThis as any).__RC_PREP_CALLS = [];
}

export function effectivePrepTrack(subject: any): 'academic' | 'aptitude' {
  return subject?.track === 'aptitude' ? 'aptitude' : 'academic';
}

export function topicSubtopics(topic: any): any[] {
  if (!topic) return [];
  if (Array.isArray(topic.subtopicDetails) && topic.subtopicDetails.length > 0) return topic.subtopicDetails;
  return (topic.subtopics ?? []).map((title: string, idx: number) => ({ id: `sub-${idx + 1}`, title, briefMd: '' }));
}

export function rememberLearnerCollege(_collegeId?: string | null): void {}

export async function fetchPrepSubjects(params?: { program?: string }): Promise<any[]> {
  record('subjects', params);
  const all: any[] = data().subjects ?? [];
  if (!params?.program) return all;
  // Mirrors the API: aptitude packs are returned for every program, academic
  // packs only for the programs they list.
  return all.filter((s) => effectivePrepTrack(s) === 'aptitude' || (s.programs ?? []).includes(params.program));
}

export async function fetchPrepSubject(subjectId: string): Promise<any> {
  record('subject', { subjectId });
  const found = (data().subjects ?? []).find((s: any) => s.id === subjectId);
  if (!found) throw new Error('not found');
  return found;
}

export async function fetchPrepTopics(subjectId: string): Promise<any[]> {
  record('topics', { subjectId });
  return (data().topics ?? []).filter((t: any) => t.subjectId === subjectId);
}

export async function fetchPrepTopic(subjectId: string, topicId: string): Promise<any> {
  record('topic', { subjectId, topicId });
  const found = (data().topics ?? []).find((t: any) => t.id === topicId);
  if (!found) throw new Error('not found');
  return found;
}

export async function fetchPracticeQuestions(_params?: any): Promise<any[]> {
  record('practice', _params);
  return data().questions ?? [];
}

export async function fetchPrepCompanies(params?: { program?: string }): Promise<any[]> {
  record('companies', params);
  const all: any[] = data().companies ?? [];
  if (!params?.program) return all;
  return all.filter((c) => (c.eligibility?.programs ?? []).includes(params.program));
}

export async function fetchPrepCompany(code: string): Promise<any> {
  record('company', { code });
  const found = (data().companies ?? []).find((c: any) => c.code === code);
  if (!found) throw new Error('not found');
  return { company: found, topics: data().companyTopics ?? [] };
}

// Company-visibility settings (CompanyPrepVisibilityPanel): stubbed with an
// empty-but-well-shaped store so the panel renders its empty state.
export interface CompanyPrepSettingsRow {
  code: string
  name: string
  testName: string
  tier: string
  programs: string[]
  hidden: boolean
}

let __companyPrepSettings = { enabled: true, hiddenCompanies: [] as string[] }

export async function fetchCompanyPrepSettings(_collegeId?: string): Promise<{
  collegeId: string
  settings: { enabled: boolean; hiddenCompanies: string[] }
  companies: CompanyPrepSettingsRow[]
}> {
  return { collegeId: 'college-a', settings: __companyPrepSettings, companies: [] }
}

export async function saveCompanyPrepSettings(
  settings: { enabled: boolean; hiddenCompanies: string[] },
  _collegeId?: string,
): Promise<{ enabled: boolean; hiddenCompanies: string[] }> {
  __companyPrepSettings = settings
  return settings
}

// Admin content-studio surfaces (PrepContentStudioTab): write paths are
// recorded no-ops; reads come from the fixtures the runner stages.
export async function generatePrepDraft(_payload?: any): Promise<any> {
  return { ok: true, topic: null }
}
export async function publishPrepTopic(_payload?: any): Promise<any> {
  return { ok: true }
}
export async function savePrepTopic(_subjectId?: string, _topic?: any): Promise<any> {
  return { ok: true }
}
export async function savePrepSubject(_subject?: any): Promise<any> {
  return { ok: true }
}
export async function seedPrepCatalog(_programs?: string | string[]): Promise<any> {
  return { ok: true, seeded: 0 }
}

export async function fetchPrepCompanyMock(code: string, count = 20): Promise<any[]> {
  record('companyMock', { code, count });
  return data().questions ?? [];
}

export default {
  fetchPrepSubjects,
  fetchPrepSubject,
  fetchPrepTopics,
  fetchPrepTopic,
  fetchPracticeQuestions,
  fetchPrepCompanies,
  fetchPrepCompany,
  fetchPrepCompanyMock,
  effectivePrepTrack,
  topicSubtopics,
  rememberLearnerCollege,
};

// ── Previous-year papers + repeated questions (items 2.1/3.3 of the hand-off) ──
// Fixtures: __RC_PREP.papers (list), __RC_PREP.paper (single), __RC_PREP.frequent.
export const PREP_PAPER_LEGACY_LABELS: Record<string, string> = { bbm: 'BBM' };

export async function fetchPrepPapers(params?: any): Promise<any> {
  record('papers', params);
  const papers = data().papers ?? [];
  return {
    papers,
    facets: data().paperFacets ?? { universities: [], years: [], semesters: [], programs: [] },
    universities: data().paperUniversities ?? [],
  };
}

export async function fetchPrepPaper(paperId: string): Promise<any> {
  record('paper', paperId);
  const paper = data().paper;
  if (!paper) throw new Error('Question paper not found');
  return paper;
}

export async function fetchFrequentQuestions(params: any): Promise<any> {
  record('frequent', params);
  return data().frequent ?? { subject: null, subjects: [], questions: [] };
}
