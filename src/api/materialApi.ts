export type MaterialType = "pdf" | "video" | "link" | "image" | "document" | "presentation";

export interface Material {
  id: string;
  title: string;
  description?: string;
  type: MaterialType;
  url: string;
  subject: string;
  classId: string;
  uploadedBy: string;
  uploadedAt: Date;
  fileSize?: number;
  thumbnailUrl?: string;
}

export const materialApi = {
  getMaterials: async (classId?: string, subject?: string): Promise<Material[]> => {
    return [];
  },
  getMaterialById: async (id: string): Promise<Material | null> => {
    return null;
  },
  uploadMaterial: async (
    data: Omit<Material, "id" | "uploadedAt">
  ): Promise<Material> => {
    return { ...data, id: "stub", uploadedAt: new Date() };
  },
  updateMaterial: async (id: string, data: Partial<Material>): Promise<Material> => {
    return {
      id,
      title: "",
      type: "pdf",
      url: "",
      subject: "",
      classId: "",
      uploadedBy: "",
      uploadedAt: new Date(),
      ...data,
    };
  },
  deleteMaterial: async (id: string): Promise<void> => {},
};
