import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import firebase from '../firebase/config';
import { auth } from '../firebase/config';
import { db } from '../firebase/config';

interface Poem {
  id: string;
  title: string;
  content: string;
  author: string;
}

const Overlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: rgb(73, 92, 75);
  z-index: 1000;
  display: ${props => props.isOpen ? 'flex' : 'none'};
  flex-direction: column;
  padding: 2rem;
  overflow-y: auto;
  justify-content: center;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #212121;
  
  &:hover {
    color: #757575;
  }
`;

const OverlayContent = styled.div`
  display: flex;
  gap: 4rem;
  
`;
const LeftSec = styled.div`
  flex: 1;
  padding-left: 2rem;
`;
const RightSec = styled.div`
  flex: 1;
  padding-right: 2rem;
  text-align: right;
  display: flex;
  flex-direction: column;
  align-content: flex-end;
  align-items: flex-end;
  justify-content: space-between;
`;



const PoemList = styled.div`
  display: flex;
  flex-direction: column;
`;

const PoemItem = styled.div<{ isCompleted: boolean }>`
  font-family: 'Pretendard-Regular';
  display: flex;
  font-size: 1.8rem;
  color: ${props => props.isCompleted ?  '#6c6c6c' : '#000'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.isCompleted ? '#EEEEEE' : '#F5F5F5'};
    color: ${props => props.isCompleted ? '#757575' : '#000'};
  }
`;

const PoemTitle = styled.span<{ isCompleted: boolean }>`
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 100%;
    height: 1px;
    background-color: ${props => props.isCompleted ? '#9E9E9E' : '#212121'};
    transform: scaleX(0);
    transition: transform 0.2s ease;
  }
  
  ${PoemItem}:hover & {
    &:after {
      transform: scaleX(1);
    }
  }
`;

const PoemNumber = styled.span`
  min-width: 120px;

`;

const MenuButton = styled.button`
  position: fixed;
  border: none;
  bottom: 30px;
  right: 110px;
  z-index: 20;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  background-color:rgb(90, 102, 87);
  justify-content: center;
  transform-origin: bottom right;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  border-radius: 25px;
  width: 50px;
  height: 50px;
  text-decoration: none;
  font-size: 24px;
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
  }

`;

const LogoTitle = styled.h2`
  font-size: 7rem;
  width: 7rem;
  color: #000;
  margin: 0;
  line-height: 1;
  line-break: strict;

`;

const BottomInfo = styled.div`
  display: flex;
  margin-right: 10px;
  flex-direction: column;
`;

const UserInfo = styled.div`
  margin-top: 1rem;
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  justify-content: flex-end;
   font-family: 'Pretendard-Regular';
  font-weight: 700;
`;

const UserName = styled.span`
  font-size: 1rem;
  color:rgb(0, 0, 0);

`;

const EditIcon = styled.button`
  background: none;
  border: none;
  color: #9e9e9e;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color:rgb(0, 0, 0);
  }
`;

const NicknameInput = styled.input`
  font-size: 1rem;
 
  border: none;
  border-bottom: 1px solid #e0e0e0;
  background: transparent;
  padding: 2px 4px;
  margin-right: 4px;
  outline: none;
  width: 100px;
  min-width: 60px;
  color:rgb(0, 0, 0);
  
  &:focus {
    border-bottom: 1px solidrgb(0, 0, 0);
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 4px;
  
`;

const ActionButton = styled.button`

  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color:rgb(0, 0, 0);
  
  &:hover {
    color:rgb(0, 0, 0);
  }
`;

const NavButton = styled.button`
  font-family: 'Pretendard-Regular';
  font-weight: 700;
  background-color: transparent;
  color:rgb(0, 0, 0);
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  &:hover {
    background-color:rgba(245, 245, 245, 0.5);
  }
`;


const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
  </svg>
);

const CancelIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
  </svg>
);

// 관리자 아이디 목록
const ADMIN_IDS = ['O8rZTec7RnX3jDBkR7NMuW7gEF93'];

const Navigation = () => {
  const { currentUser, logout, updateNickname } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [completedPoems, setCompletedPoems] = useState<string[]>([]);
  const [inputWidth, setInputWidth] = useState(0);
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const userNameRef = useRef<HTMLSpanElement>(null);

  // 사용자 정보 및 완료한 시 목록 가져오기
  useEffect(() => {
    if (currentUser) {
      setNickname(currentUser.nickname || currentUser.displayName || '');
      
      db.collection('users')
        .doc(currentUser.uid)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const userData = doc.data();
            setCompletedPoems(userData?.completedPoems || []);
          }
        })
        .catch((error) => {
          console.error('완료한 시 목록 가져오기 실패:', error);
        });
    }
  }, [currentUser]);

  // 시 목록 가져오기
  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const snapshot = await db.collection('poems').get();

        const poemList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Poem, 'id'>
        }));

        // ID를 숫자로 변환하여 정렬
        const sortedPoems = poemList.sort((a, b) => {
          const numA = parseInt(a.id);
          const numB = parseInt(b.id);
          return numA - numB;
        });

        console.log('정렬된 시 목록:', sortedPoems);
        setPoems(sortedPoems);
      } catch (error) {
        console.error('시 목록 가져오기 실패:', error);
      }
    };

    fetchPoems();
  }, []);

  useEffect(() => {
    if (isEditing && nicknameInputRef.current) {
      nicknameInputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (userNameRef.current && !isEditing) {
      const width = userNameRef.current.getBoundingClientRect().width;
      setInputWidth(width);
    }
  }, [currentUser, isEditing]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleGoogleLogin = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then((result) => {
        console.log('로그인 성공:', result.user);
        window.location.href = '/';
      })
      .catch((error) => {
        console.error('로그인 실패:', error);
      });
  };

  const handleEditNickname = () => {
    setIsEditing(true);
  };

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

  const handleCancelEdit = () => {
    setNickname(currentUser?.nickname || currentUser?.displayName || '');
    setIsEditing(false);
  };

  const formatPoemNumber = (num: number) => {
    return num.toString().padStart(3, '0');
  };

  const isAdmin = currentUser && ADMIN_IDS.includes(currentUser.uid);

  const handlePoemClick = (poemId: string) => {
    // ID가 정확히 일치하는 시로 이동
    if (window.location.pathname.startsWith('/poem/')) {
      window.location.href = `/poem/${poemId}`;
    } else {
      window.location.href = `/poem/${poemId}`;
    }
  };

  return (
    <>
      <MenuButton onClick={() => setIsOpen(true)}>
        ✍🏻
      </MenuButton>

      <Overlay isOpen={isOpen}>
        <CloseButton onClick={() => setIsOpen(false)}>×</CloseButton>
        
        <OverlayContent>
         
          
          <LeftSec>
            <PoemList>
              {poems.map((poem) => {
                const isCompleted = completedPoems.includes(poem.id);
                return (
                  <PoemItem 
                    key={poem.id} 
                    isCompleted={isCompleted}
                    onClick={() => handlePoemClick(poem.id)}
                  >
                    <PoemNumber>{formatPoemNumber(parseInt(poem.id))}</PoemNumber>
                    <PoemTitle isCompleted={isCompleted}>{poem.title}</PoemTitle>
                  </PoemItem>
                );
              })}
            </PoemList>
          </LeftSec>
          <RightSec>
            <LogoTitle>詩路</LogoTitle>
            <BottomInfo>
              {currentUser ? (
                <>
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
                        <UserName ref={userNameRef}>
                          {currentUser.nickname || currentUser.displayName}
                        </UserName>
                        <EditIcon onClick={handleEditNickname} title="닉네임 수정">
                          <PencilIcon />
                        </EditIcon>
                      </>
                    )}
                  </UserInfo>
                
                  <NavButton onClick={handleLogout}>로그아웃</NavButton>
                  {isAdmin && (
                    <NavButton as="a" href="/admin">관리자</NavButton>
                  )}

                </>
              ) : (
                <div>
                  <NavButton onClick={handleGoogleLogin}>로그인</NavButton>
                </div>
              )}
            </BottomInfo>
          </RightSec>
        </OverlayContent>
      </Overlay>
    </>
  );
};

export default Navigation; 
