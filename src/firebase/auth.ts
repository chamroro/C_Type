import firebase from './config';
import { auth, db } from './config';

// 사용자 인터페이스
export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  nickname: string;
  photoURL?: string;
  createdAt: any;
  lastLoginAt: any;
}

// 사용자 컬렉션 참조
const usersCollection = db.collection('users');

/**
 * 구글 로그인
 */
export const loginWithGoogle = async (): Promise<UserData> => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const userCredential = await auth.signInWithPopup(provider);
    const user = userCredential.user;
    
    if (!user) {
      throw new Error('구글 로그인에 실패했습니다');
    }
    
    // 사용자 문서 참조
    const userDocRef = usersCollection.doc(user.uid);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      // 기존 사용자: 마지막 로그인 시간 업데이트
      await userDocRef.update({
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return userDoc.data() as UserData;
    } else {
      // 새 사용자: 문서 생성
      const userData: UserData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || '사용자',
        nickname: user.displayName || user.email?.split('@')[0] || '사용자',
        photoURL: user.photoURL || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      
      await userDocRef.set(userData);
      return userData;
    }
  } catch (error) {
    console.error('구글 로그인 오류:', error);
    throw error;
  }
};

/**
 * 로그아웃
 */
export const signOut = async (): Promise<void> => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw error;
  }
};

/**
 * 현재 로그인된 사용자 정보 가져오기
 */
export const getCurrentUser = async (): Promise<UserData | null> => {
  const user = auth.currentUser;
  
  if (!user) {
    return null;
  }
  
  try {
    const userDoc = await usersCollection.doc(user.uid).get();
    
    if (userDoc.exists) {
      return userDoc.data() as UserData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('사용자 정보 가져오기 오류:', error);
    return null;
  }
};

/**
 * 인증 상태 변경 감지
 */
export const onAuthChange = (
  callback: (user: UserData | null) => void
): (() => void) => {
  return auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDoc = await usersCollection.doc(firebaseUser.uid).get();
        
        if (userDoc.exists) {
          callback(userDoc.data() as UserData);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

/**
 * 닉네임 중복 체크
 */
export const checkNicknameExists = async (nickname: string, currentUserId?: string): Promise<boolean> => {
  try {
    const snapshot = await usersCollection.where('nickname', '==', nickname).get();
    
    if (snapshot.empty) {
      return false;
    }
    
    // 현재 사용자의 닉네임인 경우는 중복으로 처리하지 않음
    if (currentUserId) {
      return snapshot.docs.some(doc => doc.id !== currentUserId);
    }
    
    return true;
  } catch (error) {
    console.error('닉네임 중복 체크 오류:', error);
    throw error;
  }
};

/**
 * 닉네임 업데이트
 */
export const updateUserNickname = async (
  userId: string,
  nickname: string
): Promise<void> => {
  try {
    // 닉네임 중복 체크
    const exists = await checkNicknameExists(nickname, userId);
    if (exists) {
      throw new Error('이미 사용 중인 닉네임입니다.');
    }
    
    // 닉네임 업데이트
    await usersCollection.doc(userId).update({
      nickname: nickname
    });
  } catch (error) {
    console.error('닉네임 업데이트 오류:', error);
    throw error;
  }
};

/**
 * 특정 유저의 completedPoems 배열에 시 ID를 추가
 */
export const addCompletedPoemToUser = async (userId: string, poemId: string): Promise<void> => {
  try {
    const userRef = usersCollection.doc(userId);

    await userRef.update({
      completedPoems: firebase.firestore.FieldValue.arrayUnion(poemId)
    });

    console.log(`유저 ${userId}의 completedPoems에 ${poemId} 추가됨`);
  } catch (error) {
    console.error('completedPoems 업데이트 오류:', error);
    throw error;
  }
};
