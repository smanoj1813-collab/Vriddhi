// ============================================================
// VRIDDHI - Question Submission API
// ============================================================
// Handles submitting questions for review to the universal pool
// ============================================================

import {
  collection,
  doc,
  addDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../Firebase/config';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '../../../Firebase/config';
import {
  type QuestionContent,
  type QuestionReview,
  type ApiResponse,
} from '../../admin/types/universalQuestionBank';

const storage = getStorage(app);

export const questionSubmissionApi = {
  /**
   * Submit a new question for review
   */
  async submitQuestion(
    questionData: Omit<QuestionContent, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'status' | 'quality' | 'usageStats' | 'versions' | 'storagePath' | 'metadataDocId'>,
    submittedBy: {
      userId: string;
      userName: string;
      collegeId: string | null;
      collegeName: string;
      role: 'superadmin' | 'admin' | 'faculty';
    }
  ): Promise<ApiResponse<{ questionId: string; reviewId: string }>> {
    try {
      const questionId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const now = new Date().toISOString();

      // Upload images if any
      const uploadedImages: Array<{ url: string; altText: string; storagePath: string }> = [];
      if (questionData.images && questionData.images.length > 0) {
        for (let i = 0; i < questionData.images.length; i++) {
          const file = questionData.images[i];
          if (file instanceof File) {
            const storagePath = `images/questions/${questionData.subjectId}/${questionData.topicId}/${questionId}/image_${i}.png`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, file, { contentType: file.type });
            const url = await getDownloadURL(storageRef);
            uploadedImages.push({ url, altText: `Image ${i + 1}`, storagePath });
          }
        }
      }

      // Build full question content
      const questionContent: QuestionContent = {
        id: questionId,
        version: 1,
        questionText: (questionData as any).questionText || '',
        options: (questionData as any).options || [],
        correctAnswer: (questionData as any).correctAnswer || '',
        explanation: (questionData as any).explanation || '',
        hint: (questionData as any).hint || '',
        topicId: questionData.topicId,
        subjectId: questionData.subjectId,
        subTopicId: (questionData as any).subTopicId || '',
        difficulty: questionData.difficulty,
        questionType: questionData.questionType,
        marks: questionData.marks,
        language: (questionData as any).language || 'en',
        tags: questionData.tags,
        images: uploadedImages,
        hasImage: uploadedImages.length > 0,
        createdBy: submittedBy,
        source: 'manual_submission',
        status: 'pending',
        quality: {
          rating: 0,
          reviewCount: 0,
          flagged: false,
        },
        usageStats: {
          usedInPapers: 0,
          usedInAssessments: 0,
          collegesUsing: [],
        },
        versions: [],
        storagePath: `questions/${questionData.subjectId}/${questionData.topicId}/${questionId}.json`,
        metadataDocId: questionId,
        createdAt: now,
        updatedAt: now,
      };

      // Save content to Firestore (in production, use Cloud Storage)
      await addDoc(collection(db, 'questionContents'), questionContent);

      // Create metadata entry
      const metadata = {
        id: questionId,
        topicId: questionData.topicId,
        subjectId: questionData.subjectId,
        subTopicId: (questionData as any).subTopicId || '',
        difficulty: questionData.difficulty,
        questionType: questionData.questionType,
        marks: questionData.marks,
        language: (questionData as any).language || 'en',
        tags: questionData.tags,
        status: 'pending' as const,
        storagePath: questionContent.storagePath,
        hasImage: uploadedImages.length > 0,
        qualityRating: 0,
        usageCount: 0,
        createdBy: submittedBy,
        createdAt: now,
        updatedAt: now,
      };

      await addDoc(collection(db, 'questionBank_meta'), metadata);

      // Create review entry
      const reviewData = {
        questionId,
        submittedBy,
        submittedAt: now,
        status: 'pending' as const,
        createdAt: now,
        updatedAt: now,
      };

      const reviewDoc = await addDoc(collection(db, 'questionReviews'), reviewData);

      return {
        success: true,
        data: { questionId, reviewId: reviewDoc.id },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};
