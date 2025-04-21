import React, { useState, useEffect, useRef, createRef, RefObject } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Navigation from './components/Navigation';
import PoetryTyping from './components/PoetryTyping';
import AdminPoems from './components/Admin/AdminPoems';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase/config';
import MobileWarning from './components/MobileWarning';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginBubble from './components/LoginBubble';

// 글꼴 추가
const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'Pretendard-Regular';
    src: url('https://fastly.jsdelivr.net/gh/Project-Noonnu/noonfonts_2107@1.1/Pretendard-Bold.woff') format('woff');
    font-weight: 700;
    font-style: bold;
  }
  @font-face {
    font-family: 'BookkMyungjo-Bd';
    src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2302@1.0/BookkMyungjo-Bd.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
  }

  @font-face {
    font-family: 'MaruBuri';
    src: url(https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Regular.eot);
    src: url(https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Regular.eot?#iefix) format("embedded-opentype"), 
         url(https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Regular.woff2) format("woff2"), 
         url(https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Regular.woff) format("woff"), 
         url(https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Regular.ttf) format("truetype");
  }

  @font-face {
    font-family: 'IntelOneMono';
    src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2307-1@1.1/intelone-mono-font-family-italic.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
  }

  @font-face {
    font-family: 'Shilla_CultureB-Bold';
    src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2206-02@1.0/Shilla_CultureB-Bold.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
  }

  @font-face {
    font-family: 'YESMyoungjo-Regular';
    src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_13@1.0/YESMyoungjo-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
  }

  @font-face {
    font-family: 'MapoFlowerIsland';
    src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/MapoFlowerIslandA.woff') format('woff');
    font-weight: normal;
    font-style: normal;
  }
  
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
  
  body {
    margin: 0;
    padding: 0;
    font-family: 'Noto Sans KR', sans-serif;
    background-color:rgb(255, 255, 255);
  }
`;

const AppContainer = styled.div`
  font-family: 'Noto Sans KR', sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const MainContent = styled.main`
  padding: 0rem 0;
`;

// 새로고침 아이콘 컴포넌트
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.65 2.35C12.2 0.9 10.21 0 8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C11.73 16 14.84 13.45 15.73 10H13.65C12.83 12.33 10.61 14 8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C9.66 2 11.14 2.69 12.22 3.78L9 7H16V0L13.65 2.35Z" fill="#333"/>
  </svg>
);

// Buy Me a Coffee 버튼 스타일 추가
const BuyMeCoffeeButton = styled.a`
  position: fixed;
  
  bottom: 30px;
  right: 50px;
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

const AppContent = () => {
  const { currentUser } = useAuth();
  const [path, setPath] = useState(window.location.pathname);
  const [isInitialized, setIsInitialized] = useState(false);
  const [poemsLoaded, setPoemsLoaded] = useState(false);

  // 경로 변경 이벤트 리스너
  useEffect(() => {
    const handlePathChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePathChange);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.removeEventListener('popstate', handlePathChange);
    };
  }, []);

  // 앱 초기화 시 시 데이터 확인 및 로드
  useEffect(() => {
    const checkPoems = async () => {
      if (isInitialized) return;
      
      try {
        // 파이어스토어에 시 데이터가 있는지 확인
        const poemsCollection = collection(db, 'poems');
        const snapshot = await getDocs(poemsCollection);
        
        if (snapshot.empty) {
          console.log('파이어스토어에 시 데이터가 없습니다. 로컬 데이터를 업로드합니다.');
          // 로컬 시 데이터 로드
          const poemsModule = await import('./data/poems');
          const uploadToFirestore = poemsModule.uploadPoemsToFirestore;
          
          if (typeof uploadToFirestore === 'function') {
            await uploadToFirestore();
            console.log('로컬 시 데이터가 성공적으로 업로드되었습니다.');
          }
        } else {
          console.log(`파이어스토어에 ${snapshot.size}개의 시 데이터가 있습니다.`);
        }
        
        setPoemsLoaded(true);
      } catch (error) {
        console.error('시 데이터 확인 중 오류:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    checkPoems();
  }, [isInitialized]);

  // 렌더링할 컴포넌트 결정
  let content;
  switch (path) {
    case '/login':
      content = <Login />;
      break;
    case '/signup':
      content = <Signup />;
      break;
    case '/poetry-typing':
      content = <PoetryTyping />;
      break;
    case '/admin':
      content = <AdminPoems />;
      break;
    default:
      content = <PoetryTyping />;
      break;
  }

  return (
    <>
      <MobileWarning />
      <GlobalStyle />
      <AppContainer>
        <Navigation />
        <MainContent>
          {!isInitialized ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              데이터를 불러오는 중입니다...
            </div>
          ) : (
            content
          )}
        </MainContent>
      </AppContainer>
      {!currentUser && <LoginBubble />}
      <BuyMeCoffeeButton href="https://www.buymeacoffee.com/kimhaeun" target="_blank" rel="noopener noreferrer">
        💌
      </BuyMeCoffeeButton>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App; 