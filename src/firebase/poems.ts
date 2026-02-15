import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './config';

// 시 인터페이스
interface CompletedUser {
  id: string;
  comment?: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

export interface Poem {
  id: string;
  title: string;
  content: string;
  author: string;
  completedUsers?: Array<string | CompletedUser>;
}

const getCompletedUserId = (entry: string | CompletedUser): string =>
  typeof entry === 'string' ? entry : entry.id;

/**
 * 모든 시 가져오기
 */
export const getAllPoems = async (): Promise<Poem[]> => {
  try {
    console.log('파이어스토어에서 시 데이터 가져오기 시도...');
    const poemsCollection = collection(db, 'poems');
    const poemSnapshot = await getDocs(poemsCollection);

    console.log(`파이어스토어에서 ${poemSnapshot.size}개의 시를 불러왔습니다.`);
    return poemSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        author: data.author,
        completedUsers: data.completedUsers || [],
      };
    });
  } catch (error) {
    console.error('시 목록 가져오기 오류:', error);
    throw error;
  }
};

/**
 * 특정 시 가져오기
 */
export const getPoem = async (poemId: string): Promise<Poem | null> => {
  try {
    const poemDoc = await getDoc(doc(db, 'poems', poemId));

    if (!poemDoc.exists()) {
      return null;
    }

    const data = poemDoc.data();
    return {
      id: poemDoc.id,
      title: data.title,
      content: data.content,
      author: data.author,
      completedUsers: data.completedUsers || [],
    };
  } catch (error) {
    console.error('시 정보 가져오기 오류:', error);
    throw error;
  }
};

/**
 * 시 완료 정보 저장하기
 */
export const saveCompletedPoem = async (
  uid: string,
  poemId: string,
  comment: string,
): Promise<void> => {
  try {
    // 시 문서의 completedUsers 배열에 사용자 ID 추가
    const poemRef = doc(db, 'poems', poemId);
    await updateDoc(poemRef, {
      completedUsers: arrayUnion({ id: uid, comment: comment || '', createdAt: Timestamp.now() }),
    });

    // 사용자 통계 업데이트 (필요하다면)
    // 이 부분은 auth.ts의 addCompletedPoem 함수에서 처리
  } catch (error) {
    console.error('완료한 시 저장 오류:', error);
    throw error;
  }
};

/**
 * 사용자가 완료한 시 목록 가져오기
 */
export const getUserCompletedPoems = async (userId: string): Promise<Poem[]> => {
  try {
    // 모든 시 가져오기
    const allPoems = await getAllPoems();

    // 사용자가 완료한 시만 필터링
    return allPoems.filter(
      (poem) =>
        poem.completedUsers &&
        poem.completedUsers.some((completedUser) => getCompletedUserId(completedUser) === userId),
    );
  } catch (error) {
    console.error('완료한 시 목록 가져오기 오류:', error);
    throw error;
  }
};

/**
 * 사용자가 완료하지 않은 시 목록 가져오기
 */
export const getUncompletedPoems = async (userId: string): Promise<Poem[]> => {
  try {
    // 모든 시 가져오기
    const allPoems = await getAllPoems();

    // 완료하지 않은 시만 필터링
    return allPoems.filter(
      (poem) =>
        !poem.completedUsers ||
        !poem.completedUsers.some((completedUser) => getCompletedUserId(completedUser) === userId),
    );
  } catch (error) {
    console.error('완료하지 않은 시 목록 가져오기 오류:', error);
    throw error;
  }
};

/**
 * 특정 시를 완료한 사용자 목록 가져오기
 */
export const getUsersWhoCompletedPoem = async (
  poemId: string,
  limitCount: number = 10,
): Promise<string[]> => {
  try {
    const poemRef = doc(db, 'poems', poemId);
    const poemDoc = await getDoc(poemRef);

    if (poemDoc.exists()) {
      const poemData = poemDoc.data();
      const completedUsers = poemData.completedUsers || [];

      // 제한된 수의 사용자 ID 반환
      return completedUsers.slice(0, limitCount).map(getCompletedUserId);
    }

    return [];
  } catch (error) {
    console.error('시를 완료한 사용자 목록 가져오기 오류:', error);
    throw error;
  }
};

/**
 * 특정 시를 완료한 사용자 ID 목록 가져오기
 */
export const getCompletedUserIds = async (poemId: string): Promise<string[]> => {
  try {
    const poemRef = doc(db, 'poems', poemId);
    const poemDoc = await getDoc(poemRef);

    if (poemDoc.exists()) {
      const poemData = poemDoc.data();
      return (poemData.completedUsers || []).map(getCompletedUserId);
    }

    return [];
  } catch (error) {
    console.error('완료한 사용자 ID 목록 가져오기 오류:', error);
    throw error;
  }
};
