import firebase from './config';
import { auth, db } from './config';

// 사용자 인터페이스 확장: 작성한 시 번호 배열 추가
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
 * 이메일로 회원가입
 */
export const registerWithEmail = async (
  email: string, 
  password: string, 
  displayName: string
): Promise<UserData> => {
  try {
    // Firebase 인증으로 사용자 생성
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    if (!user) {
      throw new Error('사용자 생성에 실패했습니다');
    }
    
    // 사용자 프로필 업데이트
    await user.updateProfile({ displayName });
    
    // 초기 사용자 데이터 생성
    const userData: UserData = {
      uid: user.uid,
      email: user.email || email,
      displayName: displayName,
      nickname: displayName, // 기본값으로 displayName 사용
      photoURL: user.photoURL || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    
    // Firestore에 사용자 정보 저장
    await usersCollection.doc(user.uid).set(userData);
    
    return userData;
  } catch (error) {
    console.error('회원가입 오류:', error);
    throw error;
  }
};

/**
 * 이메일로 로그인
 */
export const loginWithEmail = async (
  email: string, 
  password: string
): Promise<UserData> => {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    if (!user) {
      throw new Error('로그인에 실패했습니다');
    }
    
    // 사용자 문서 참조
    const userDocRef = usersCollection.doc(user.uid);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      // 마지막 로그인 시간 업데이트
      await userDocRef.update({
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return userDoc.data() as UserData;
    } else {
      // 사용자 문서가 없는 경우 생성
      const userData: UserData = {
        uid: user.uid,
        email: user.email || email,
        displayName: user.displayName || email.split('@')[0],
        nickname: user.displayName || email.split('@')[0],
        photoURL: user.photoURL || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      
      await userDocRef.set(userData);
      return userData;
    }
  } catch (error) {
    console.error('로그인 오류:', error);
    throw error;
  }
};

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
 * 닉네임 중복 확인 함수
 */
export const checkNicknameExists = async (nickname: string, currentUserId?: string): Promise<boolean> => {
  try {
    // 닉네임으로 사용자 쿼리
    const nicknameQuery = await usersCollection.where('nickname', '==', nickname).get();
    
    // 닉네임이 이미 존재하는지 확인
    // 현재 사용자 ID가 주어진 경우, 자기 자신은 제외
    if (!nicknameQuery.empty) {
      // 현재 사용자의 ID가 제공된 경우 자신은 제외
      if (currentUserId) {
        return nicknameQuery.docs.some(doc => doc.id !== currentUserId);
      }
      return true; // 중복된 닉네임 존재
    }
    
    return false; // 중복된 닉네임 없음
  } catch (error) {
    console.error('닉네임 중복 확인 오류:', error);
    throw error;
  }
};

// 닉네임 업데이트 함수
export const updateUserNickname = async (
  userId: string,
  nickname: string
): Promise<void> => {
  try {
    // 닉네임 중복 확인
    const nicknameExists = await checkNicknameExists(nickname, userId);
    
    if (nicknameExists) {
      throw new Error('이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.');
    }
    
    // 사용자 문서 참조 업데이트
    const userDocRef = usersCollection.doc(userId);
    
    // 닉네임 필드만 업데이트
    await userDocRef.update({
      nickname: nickname
    });
    
    console.log('닉네임 업데이트 성공:', nickname);
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
