import { useState } from 'react';
import { Sparkles, Wand2, Loader2, Copy, Check, AlertCircle } from 'lucide-react';

export default function FacultyAIQuestions() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateQuestions = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    // TODO: integrate with your AI service
    await new Promise(r => setTimeout(r, 1500));
    const mock = Array.from({ length: count }, (_, i) =>
      `Q${i + 1}. [${difficulty.toUpperCase()}] Explain the concept of "${topic}" with a real-world example.`
    );
    setQuestions(mock);
    setLoading(false);
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Generate custom questions using AI</p>
          </div>
        </div>
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Topic / Subject</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Financial Accounting"
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
          </div>
        </div>

        {/* Results Panel */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Generated Questions</h3>
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <AlertCircle size={32} className="mb-3 opacity-50" />
              <p>No questions generated yet</p>
              <p className="text-sm">Enter a topic and click Generate</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/50">
                  <span className="text-violet-400 font-bold text-sm shrink-0">{i + 1}.</span>
                  <p className="text-sm text-slate-800 dark:text-slate-200 flex-1">{q}</p>
                  <button
                    onClick={() => copyToClipboard(q, i)}
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