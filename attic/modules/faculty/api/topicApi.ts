export type TopicStatus = "planned" | "in-progress" | "completed" | "delayed" | "pending" | "in_progress" | "cancelled";

export interface Topic {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  subject?: string;
  course?: string;
  batch?: string;
  division?: string;
  classId?: string;
  status: TopicStatus;
  plannedDate?: string;
  scheduledDate?: Date | string;
  duration?: number;
  resources?: string[];
  notes?: string;
  unit?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const topicApi = {
  getTopics: async (classId?: string, subject?: string): Promise<Topic[]> => {
    return [];
  },
  getTopicById: async (id: string): Promise<Topic | null> => {
    return null;
  },
  createTopic: async (
    data: Omit<Topic, "id" | "createdAt" | "updatedAt">
  ): Promise<Topic> => {
    return { ...data, id: "stub", createdAt: new Date(), updatedAt: new Date() };
  },
  updateTopic: async (id: string, data: Partial<Topic>): Promise<Topic> => {
    return {
      id,
      name: "",
      subject: "",
      classId: "",
      status: "planned",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
  },
  deleteTopic: async (id: string): Promise<void> => {},
};