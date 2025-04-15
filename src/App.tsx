import React, { useState, useEffect, useRef, createRef, RefObject } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import poems from './data/poems';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Navigation from './components/Navigation';
import PoetryTyping from './components/PoetryTyping';
import AdminPoems from './components/Admin/AdminPoems';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase/config';

// 글꼴 추가
const GlobalStyle = createGlobalStyle`
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
  padding: 2rem 0;
`;

const Title = styled.h1`
  color: black;
  margin-bottom: 1rem;
`;

const FontSelectorContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 10px;
`;

const FontChip = styled.button<{ isSelected: boolean }>`
  padding: 8px 16px;
  border-radius: 50px;
  background-color: ${props => props.isSelected ? '#333' : '#f0f0f0'};
  color: ${props => props.isSelected ? 'white' : '#333'};
  border: 1px solid #ddd;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.isSelected ? '#555' : '#e0e0e0'};
  }
  
  /* 각 폰트마다 실제 폰트를 미리보기로 적용 */
  &.BookkMyungjo-Bd {
    font-family: 'BookkMyungjo-Bd', serif;
  }
  
  &.MaruBuri {
    font-family: 'MaruBuri', serif;
  }
  
  &.IntelOneMono {
    font-family: 'IntelOneMono', monospace;
  }
  
  &.Shilla_CultureB-Bold {
    font-family: 'Shilla_CultureB-Bold', serif;
  }
  
  &.YESMyoungjo-Regular {
    font-family: 'YESMyoungjo-Regular', serif;
  }
  
  &.MapoFlowerIsland {
    font-family: 'MapoFlowerIsland', serif;
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  margin: 0 auto 1.5rem;
  border-radius: 50px;
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e0e0e0;
  }
  
  svg {
    margin-right: 8px;
  }
`;

const PoemInfo = styled.div`
  margin-bottom: 1.5rem;
  
  h2 {
    font-size: 1.4rem;
    margin-bottom: 0.3rem;
  }
  
  p {
    font-size: 1rem;
    color: #666;
  }
`;

const TypingArea = styled.div`
  margin-bottom: 2rem;
  position: relative;
  text-align: left;
`;

const TextContainer = styled.div<{ fontFamily: string }>`
  position: relative;
  font-size: 1.5rem;
  line-height: 1.8;
  font-family: ${props => props.fontFamily}, monospace;
`;

const LineContainer = styled.div`
  position: relative;
  height: 1.8em;
  margin-bottom: 0.2em;
`;

const BaseLine = styled.div<{ fontFamily: string }>`
  white-space: pre;
  color: lightgray;
  position: absolute;
  top: 0;
  left: 0;
  font-family: ${props => props.fontFamily}, monospace;
`;

const InputLine = styled.input<{ fontFamily: string }>`
  width: 100%;
  font-size: 1.5rem;
  line-height: 1.8;
  font-family: ${props => props.fontFamily}, monospace;
  background: transparent;
  border: none;
  outline: none;
  color: transparent;
  caret-color: black;
  position: absolute;
  top: 0;
  left: 0;
  padding: 0;
`;

const OverlayLine = styled.div<{ fontFamily: string }>`
  white-space: pre;
  position: absolute;
  top: 0;
  left: 0;
  font-family: ${props => props.fontFamily}, monospace;
  pointer-events: none;
`;

const Char = styled.span<{ status: 'correct' | 'incorrect' | 'waiting' | 'composing' }>`
  color: ${props => {
    switch (props.status) {
      case 'correct': return 'black';
      case 'incorrect': return '#ff4444';
      case 'waiting': return 'transparent';
      case 'composing': return 'black'; // 조합 중인 글자는 검정색으로
    }
  }};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: #444;
  margin-bottom: 1rem;
  border-radius: 2px;
`;

const Progress = styled.div<{ width: number }>`
  width: ${props => props.width}%;
  height: 100%;
  background-color: ${props => props.width === 100 ? '#4CAF50' : '#666'};
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const CompletionMessage = styled.div<{ show: boolean }>`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.9);
  padding: 2rem;
  border-radius: 8px;
  display: ${props => props.show ? 'block' : 'none'};
  z-index: 100;
  text-align: center;
  color: white;
`;

// 폰트 옵션 정의
const fontOptions = [
  { id: 'BookkMyungjo-Bd', name: '부크크 명조' },
  { id: 'MaruBuri', name: '마루부리' },
  { id: 'IntelOneMono', name: 'Intel One Mono' },
  { id: 'Shilla_CultureB-Bold', name: '신라문화체' },
  { id: 'YESMyoungjo-Regular', name: '예스 명조' },
  { id: 'MapoFlowerIsland', name: '마포꽃섬' }
];

// 새로고침 아이콘 컴포넌트
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.65 2.35C12.2 0.9 10.21 0 8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C11.73 16 14.84 13.45 15.73 10H13.65C12.83 12.33 10.61 14 8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C9.66 2 11.14 2.69 12.22 3.78L9 7H16V0L13.65 2.35Z" fill="#333"/>
  </svg>
);

const App: React.FC = () => {
  // 현재 경로 상태 관리
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
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App; 