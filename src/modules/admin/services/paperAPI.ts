import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/Firebase/config';
import { Paper, PaperConfig } from '../types/paper';

const PAPERS_COLLECTION = 'papers';

export const createPaper = async (
  collegeId: string,
  paperData: Omit<Paper, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Paper> => {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, PAPERS_COLLECTION), {
    ...paperData,
    collegeId,
    createdAt: now,
    updatedAt: now
  });

  return {
    id: docRef.id,
    ...paperData,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString()
  } as Paper;
};

export const updatePaper = async (
  paperId: string,
  updates: Partial<Paper>
): Promise<void> => {
  const docRef = doc(db, PAPERS_COLLECTION, paperId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

export const deletePaper = async (paperId: string): Promise<void> => {
  await deleteDoc(doc(db, PAPERS_COLLECTION, paperId));
};

export const getPaperById = async (paperId: string): Promise<Paper | null> => {
  const docRef = doc(db, PAPERS_COLLECTION, paperId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Paper;
  }
  return null;
};

export const getPapers = async (collegeId: string): Promise<Paper[]> => {
  try {
    const q = query(
      collection(db, PAPERS_COLLECTION),
      where('collegeId', '==', collegeId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const papers: Paper[] = [];
    snapshot.forEach((doc) => {
      papers.push({ id: doc.id, ...doc.data() } as Paper);
    });
    return papers;
  } catch (err: any) {
    // Fallback if index is still building — query without orderBy
    if (err?.message?.includes('requires an index') || err?.code === 'failed-precondition') {
      console.warn('[getPapers] Index missing/building, falling back to simple query:', err.message);
      const fallbackQ = query(
        collection(db, PAPERS_COLLECTION),
        where('collegeId', '==', collegeId)
      );
      const snapshot = await getDocs(fallbackQ);
      const papers: Paper[] = [];
      snapshot.forEach((doc) => {
        papers.push({ id: doc.id, ...doc.data() } as Paper);
      });
      // Sort in memory
      return papers.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() || new Date(a.createdAt).getTime() || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() || new Date(b.createdAt).getTime() || 0;
        return bTime - aTime;
      });
    }
    throw err;
  }
};

export const duplicatePaper = async (paperId: string, collegeId: string): Promise<Paper> => {
  const original = await getPaperById(paperId);
  if (!original) throw new Error('Paper not found');

  const { id, createdAt, updatedAt, ...rest } = original;

  return createPaper(collegeId, {
    ...rest,
    title: `${rest.title} (Copy)`,
    status: 'draft'
  });
};

export const generatePaperPDF = async (paperId: string): Promise<string> => {
  // This would integrate with a PDF generation service
  // For now, return a placeholder
  console.log(`Generating PDF for paper ${paperId}`);
  return `paper_${paperId}.pdf`;
};