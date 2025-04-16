import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';

const NavContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2.5rem 0.5rem 2.5rem;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  font-family: 'Arial', sans-serif;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Logo = styled.div`
  font-size: 1.2rem;
  font-weight: 900;
  color: #212121;
  letter-spacing: -0.02em;
  cursor: pointer;
  position: relative;

`;

const NavLinks = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const NavButton = styled.a`
  padding: 0.6rem 1.2rem;
  background-color: transparent;
  color: #212121;
  text-decoration: none;
  font-weight: 400;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  letter-spacing: 0.02em;

  &:hover {
    background-color: #f9f9f9;
    border-color: #bdbdbd;
  }
`;

const NavLink = styled.a`
  color: #757575;
  text-decoration: none;
  padding: 0.5rem 0;
  font-size: 0.8rem;
  letter-spacing: 0.02em;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 1px;
    background-color: #212121;
    transition: width 0.3s;
  }

  &:hover {
    color: #212121;
    
    &:after {
      width: 100%;
    }
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  min-width: 60px;
  margin-left: 2rem;
  padding-left: 2rem;
  
`;

const UserName = styled.span`
  font-size: 0.8rem;
  font-weight: 400;
  color: #212121;
  letter-spacing: 0.01em;
`;

const EditIcon = styled.button`
  background: none;
  border: none;
  color: #9e9e9e;
  padding: 4px;
  margin-left: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #212121;
  }
`;

const NicknameInput = styled.input`
  font-size: 0.8rem;
  font-weight: 400;
  border: none;
  border-bottom: 1px solid #e0e0e0;
  background: transparent;
  padding: 2px 4px;
  margin-right: 4px;
  outline: none;
  width: ${props => props.width ? `${props.width}px` : 'auto'};
  min-width: 60px;
  color: #212121;
  
  &:focus {
    border-bottom: 1px solid #212121;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9e9e9e;
  
  &:hover {
    color: #212121;
  }
`;

// 연필 아이콘 컴포넌트
const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/>
  </svg>
);

// 체크 아이콘 컴포넌트
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
  </svg>
);

// 취소 아이콘 컴포넌트
const CancelIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
  </svg>
);

// 관리자 아이디 목록 (임시로 이 방식 사용, 실제로는 Firestore에 권한 정보를 저장하는 것이 좋음)
const ADMIN_IDS = ['O8rZTec7RnX3jDBkR7NMuW7gEF93']; // AdminPoems.tsx와 동일한 UID 사용

const Navigation = () => {
  const { currentUser, logout, updateNickname } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const [inputWidth, setInputWidth] = useState(0);
  const userNameRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (currentUser) {
      setNickname(currentUser.nickname || currentUser.displayName || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (isEditing && nicknameInputRef.current) {
      nicknameInputRef.current.focus();
    }
  }, [isEditing]);

  // 닉네임 길이에 맞게 입력 필드 너비 계산
  useEffect(() => {
    if (userNameRef.current && !isEditing) {
      const width = userNameRef.current.getBoundingClientRect().width;
      setInputWidth(width);
    }
  }, [currentUser, isEditing]);

  const handleLogout = async () => {
    try {
      await logout();
      // 로그아웃 후 필요한 리다이렉션은 여기서 처리
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  // 닉네임 편집 시작
  const handleEditNickname = () => {
    setIsEditing(true);
  };

  // 닉네임 저장
  const handleSaveNickname = async () => {
    if (nickname.trim() && currentUser) {
      try {
        await updateNickname(nickname);
        setIsEditing(false);
      } catch (error) {
        console.error('닉네임 업데이트 실패:', error);
        alert('닉네임 업데이트에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 닉네임 편집 취소
  const handleCancelEdit = () => {
    setNickname(currentUser?.nickname || currentUser?.displayName || '');
    setIsEditing(false);
  };

  // 페이지 이동 함수
  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  // 관리자 권한 확인
  const isAdmin = currentUser && ADMIN_IDS.includes(currentUser.uid);

  return (
    <NavContainer>
      <Logo onClick={() => navigateTo('/')}>詩路</Logo>
      <NavLinks>
        {currentUser ? (
          <>
          
            {/* <NavLink href="/profile">마이페이지</NavLink>  */}
            {isAdmin && (
              <NavLink href="/admin" style={{ color: '#757575' }}>관리자</NavLink>
            )}
            
            <UserInfo>
              {isEditing ? (
                <>
                  <NicknameInput
                    ref={nicknameInputRef}
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveNickname()}
                    maxLength={10}
                    width={inputWidth}
                  />
                  <ButtonsContainer>
                    <ActionButton onClick={handleSaveNickname} title="저장">
                      <CheckIcon />
                    </ActionButton>
                    <ActionButton onClick={handleCancelEdit} title="취소">
                      <CancelIcon />
                    </ActionButton>
                  </ButtonsContainer>
                </>
              ) : (
                <>
                  <UserName ref={userNameRef}>{currentUser.nickname || currentUser.displayName}</UserName>
                  <EditIcon onClick={handleEditNickname} title="닉네임 수정">
                    <PencilIcon />
                  </EditIcon>
                </>
              )}
            </UserInfo>
            <NavButton as="button" onClick={handleLogout}>
              로그아웃
            </NavButton>
          </>
        ) : (
          <>
            <NavButton href="/login">로그인</NavButton>
            <NavButton href="/signup" style={{ borderColor: '#212121' }}>
              회원가입
            </NavButton>
          </>
        )}
      </NavLinks>
    </NavContainer>
  );
};

export default Navigation; 