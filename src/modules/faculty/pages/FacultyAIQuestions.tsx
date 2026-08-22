import { useState } from 'react';
import { Sparkles, Wand2, Loader2, Copy, Check, AlertCircle, Save } from 'lucide-react';
import { useAIQuestionGenerator } from '../../admin/hooks/useAIQuestionGenerator';
import { useAuth } from '../../auth/context/AuthContext';
import type { GeneratedQuestion } from '../../admin/types/questionBank';

export default function FacultyAIQuestions() {
  const { user } = useAuth();
  const { generate, saveAll, generating, saving, error } = useAIQuestionGenerator();
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  const generateQuestions = async () => {
    if (!topic.trim()) return;
    setLoadingState(true);
    setSaveMessage('');
    try {
      const result = await generate({
        subject: subject.trim() || topic.trim(),
        topic: topic.trim(),
        questionType: 'mcq',
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        count,
        marks: 1,
        language: 'English',
        includeExplanation: true,
        batch: '',
        branch: '',
      });
      setQuestions(result.questions);
    } catch {
      // error message is surfaced by the hook
    } finally {
      setLoadingState(false);
    }
  };

  // Local loading state mirrors the hook's generating state.
  const [localLoading, setLocalLoading] = useState(false);
  const loading = generating || localLoading;

  function setLoadingState(value: boolean) {
    setLocalLoading(value);
  }

  const saveGenerated = async () => {
    if (questions.length === 0) return;
    setSaveMessage('');
    try {
      const saved = await saveAll(questions, '', '');
      setSaveMessage(`Saved ${saved.length} question(s) to the question bank.`);
    } catch {
      setSaveMessage('Failed to save questions. Please try again.');
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="min-h-full p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Question Generator</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Generate custom questions using AI and save them to the question bank</p>
          </div>
        </div>
        {user?.name && <p className="text-xs text-slate-500">Signed in as {user.name}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="glass-card p-6 lg:col-span-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Wand2 size={18} className="text-violet-400" />
            Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Financial Accounting"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Double Entry Book Keeping"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-field w-full">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Number of Questions</label>
              <input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="input-field w-full"
              />
            </div>
            <button
              onClick={generateQuestions}
              disabled={loading || !topic.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? 'Generating...' : 'Generate Questions'}
            </button>
            {questions.length > 0 && (
              <button
                onClick={saveGenerated}
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center gap-2 bg-teal-500 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : `Save All (${questions.length})`}
              </button>
            )}
            {saveMessage && <p className="text-xs text-teal-400">{saveMessage}</p>}
          </div>
        </div>

        {/* Results Panel */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Generated Questions</h3>
          {error && (
            <div className="flex items-start gap-3 p-4 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <AlertCircle size={32} className="mb-3 opacity-50" />
              <p>No questions generated yet</p>
              <p className="text-sm">Enter a topic and click Generate</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id || i} className="flex items-start gap-3 p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50">
                  <span className="text-violet-400 font-bold text-sm shrink-0">{i + 1}.</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      {q.text}
                      <span className="ml-2 text-xs text-slate-400">[{q.difficulty}] {q.type} · {q.marks} mark</span>
                    </p>
                    {q.options && q.options.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        {q.options.map((opt, oi) => (
                          <li key={opt.id || oi}>{opt.id || String.fromCharCode(65 + oi)}. {opt.text}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => copyToClipboard(q.text, i)}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                    title="Copy"
                  >
                    {copiedIndex === i ? <Check size={14} className="text-teal-400" /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
