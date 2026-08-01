import { useState, useEffect, useCallback } from "react";
import { Topic, topicApi } from "../api/topicApi";

export function useTopics(classId?: string, subject?: string) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await topicApi.getTopics(classId, subject);
      setTopics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch topics");
    } finally {
      setLoading(false);
    }
  }, [classId, subject]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  return { topics, loading, error, refetch: fetchTopics };
}
