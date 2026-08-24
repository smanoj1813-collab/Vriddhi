export type TopicStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Topic {
  id: string;
  name: string;
  description?: string;
  subject: string;
  classId: string;
  status: TopicStatus;
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
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
  },
  deleteTopic: async (id: string): Promise<void> => {},
};
