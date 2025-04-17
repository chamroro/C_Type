import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  registerWithEmail, 
  loginWithEmail, 
  loginWithGoogle, 
  signOut, 
  onAuthChange,
  UserData,
  updateUserNickname
} from '../firebase/auth';
import NicknameModal from '../components/NicknameModal';

// 인증 컨텍스트 타입 정의
interface AuthContextType {
  currentUser: UserData | null;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  showNicknameModal: boolean;
  setShowNicknameModal: (show: boolean) => void;
  updateNickname: (nickname: string) => Promise<void>;
  isNewUser: boolean;
  nicknameLoading: boolean;
}

// 인증 컨텍스트 생성
const AuthContext = createContext<AuthContextType | null>(null);

// 컨텍스트 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 인증 제공자 컴포넌트
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [nicknameLoading, setNicknameLoading] = useState(false);

  // 오류 초기화
  const clearError = () => setError(null);

  // 회원가입 함수
  const register = async (email: string, password: string, displayName: string) => {
    try {
      clearError();
      const userData = await registerWithEmail(email, password, displayName);
      setCurrentUser(userData);
      setIsNewUser(true);
      setShowNicknameModal(true);
    } catch (err: any) {
      let errorMessage = '회원가입에 실패했습니다.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다.';
      }
      
      setError(errorMessage);
      throw err;
    }
  };

  // 로그인 함수
  const login = async (email: string, password: string) => {
    try {
      clearError();
      const userData = await loginWithEmail(email, password);
      setCurrentUser(userData);
      
      // 닉네임이 없는 경우에만 모달 표시
      const shouldShowModal = !userData.nickname || userData.nickname.trim() === '';
      setIsNewUser(shouldShowModal);
      
      if (shouldShowModal) {
        setTimeout(() => {
          setShowNicknameModal(true);
        }, 500); // 약간의 지연을 두어 UI가 준비된 후 모달 표시
      } else {
        // 닉네임이 이미 있으면 홈페이지로 리다이렉트
        window.location.href = '/';
      }
    } catch (err: any) {
      let errorMessage = '로그인에 실패했습니다.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = '계정이 비활성화되었습니다.';
      }
      
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * 구글 계정으로 로그인
   */
  const loginWithGoogleAuth = async () => {
    try {
      clearError();
      setLoading(true);
      
      // 로그인 타임아웃 설정 (10초)
      const loginPromise = loginWithGoogle();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('구글 로그인 시간 초과')), 10000);
      });
      
      // 둘 중 먼저 완료되는 Promise 사용
      const userData = await Promise.race([loginPromise, timeoutPromise]) as UserData;
      
      // 사용자가 처음 로그인했는지 확인 (생성 시간과 마지막 로그인 시간이 같으면 새 사용자로 간주)
      const isFirstLogin = userData.createdAt && userData.lastLoginAt && 
        userData.createdAt.seconds === userData.lastLoginAt.seconds;
      
      setCurrentUser(userData);
      
      // 새 사용자이면서 닉네임이 없는 경우에만 모달 표시
      // 이미 닉네임이 설정된 사용자는 모달 표시하지 않음
      const shouldShowModal = (isFirstLogin || !userData.nickname) && (!userData.nickname || userData.nickname.trim() === '');
      setIsNewUser(shouldShowModal);
      
      if (shouldShowModal) {
        setTimeout(() => {
          setShowNicknameModal(true);
        }, 500); // 약간의 지연을 두어 UI가 준비된 후 모달 표시
      } else {
        // 모달을 표시하지 않는 경우 홈페이지로 리다이렉트
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error("구글 로그인 실패:", error);
      if (error.message === '구글 로그인 시간 초과') {
        setError('로그인 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('네트워크 연결 실패: 인터넷 연결을 확인해주세요.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('로그인 창이 닫혔습니다. 다시 시도해주세요.');
      } else {
        setError('구글 로그인에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
      }
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      clearError();
      await signOut();
      setCurrentUser(null);
      setIsNewUser(false);
    } catch (err: any) {
      setError('로그아웃에 실패했습니다.');
      throw err;
    }
  };

  // 닉네임 업데이트 함수
  const updateNickname = async (nickname: string) => {
    if (!nickname || nickname.trim() === '') {
      setError('닉네임을 입력해주세요.');
      return;
    }
    
    try {
      if (!currentUser) {
        throw new Error('로그인 상태가 아닙니다');
      }
      
      setNicknameLoading(true);
      console.log('닉네임 업데이트 시작:', nickname);
      
      // 닉네임 업데이트 함수 호출
      await updateUserNickname(currentUser.uid, nickname);
      console.log('Firebase 닉네임 업데이트 완료');
      
      // 현재 사용자 정보 업데이트
      setCurrentUser({
        ...currentUser,
        nickname: nickname
      });
      
      console.log('사용자 상태 업데이트 완료');
      
      // 모달 닫기
      setShowNicknameModal(false);
      // 새 사용자 상태 해제
      setIsNewUser(false);
      
      // 성공 로그
      console.log('닉네임 업데이트 완료:', nickname);
      
      
    } catch (error: any) {
      console.error('닉네임 업데이트 실패:', error);
      const errorMessage = error.message || '알 수 없는 오류';
      console.error('에러 상세 정보:', errorMessage);
      setError('닉네임 업데이트에 실패했습니다: ' + errorMessage);
      
      // 사용자에게 알림
      alert('닉네임 업데이트에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setNicknameLoading(false);
    }
  };

  // 인증 상태 변경 감지
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // 정리 함수
    return unsubscribe;
  }, []);

  // 컨텍스트 값
  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    loginWithGoogle: loginWithGoogleAuth,
    logout,
    clearError,
    showNicknameModal,
    setShowNicknameModal,
    updateNickname,
    isNewUser,
    nicknameLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && (
        <>
          {children}
          
          {/* 닉네임 설정 모달 */}
          {showNicknameModal && currentUser && (
            <NicknameModal 
              isOpen={showNicknameModal}
              initialNickname={currentUser.nickname || currentUser.displayName || ''}
              onSave={updateNickname}
              onClose={() => {
                setShowNicknameModal(false);
                setIsNewUser(false);
              }}
              isLoading={nicknameLoading}
            />
          )}
        </>
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext; 