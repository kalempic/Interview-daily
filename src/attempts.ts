import { loadFirebase } from './firebase';

export type SavedAttempt = {
  id: string;
  uid: string;
  drillId: string;
  answer: string;
  scoreLabel: string;
  covered: string[];
  missing: string[];
  hitHeadings: string[];
  createdAt: Date | null;
};

export type NewAttempt = {
  uid: string;
  drillId: string;
  answer: string;
  scoreLabel: string;
  covered: string[];
  missing: string[];
  hitHeadings: string[];
};

export async function saveAttempt(attempt: NewAttempt): Promise<void> {
  const { db } = await loadFirebase();
  const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
  await addDoc(collection(db, 'attempts'), {
    uid: attempt.uid,
    drillId: attempt.drillId,
    answer: attempt.answer,
    scoreLabel: attempt.scoreLabel,
    covered: attempt.covered,
    missing: attempt.missing,
    hitHeadings: attempt.hitHeadings,
    createdAt: serverTimestamp(),
  });
}

export async function loadAttempts(uid: string): Promise<SavedAttempt[]> {
  const { db } = await loadFirebase();
  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const snapshot = await getDocs(query(collection(db, 'attempts'), where('uid', '==', uid)));
  const attempts = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      uid: stringField(data.uid),
      drillId: stringField(data.drillId),
      answer: stringField(data.answer),
      scoreLabel: stringField(data.scoreLabel),
      covered: stringList(data.covered),
      missing: stringList(data.missing),
      hitHeadings: stringList(data.hitHeadings),
      createdAt: toDate(data.createdAt),
    };
  });
  attempts.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  return attempts;
}

function stringField(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function toDate(value: unknown): Date | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date ? date : null;
  }
  return null;
}
