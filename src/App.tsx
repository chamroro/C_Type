import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import PoetryTyping from './components/PoetryTyping';
import AdminPoems from './components/Admin/AdminPoems';
import MobileWarning from './components/MobileWarning';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginBubble from './components/LoginBubble';
import DailyPopup from './components/DailyPopup';

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
    <path
      d="M13.65 2.35C12.2 0.9 10.21 0 8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C11.73 16 14.84 13.45 15.73 10H13.65C12.83 12.33 10.61 14 8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C9.66 2 11.14 2.69 12.22 3.78L9 7H16V0L13.65 2.35Z"
      fill="#333"
    />
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
      {/* <DailyPopup /> */}
      <BuyMeCoffeeButton
        href="https://www.buymeacoffee.com/kimhaeun"
        target="_blank"
        rel="noopener noreferrer"
      >
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
