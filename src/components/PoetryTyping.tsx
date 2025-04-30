import React, { useState, useRef, useEffect, createRef, RefObject } from 'react';
import styled, { css } from 'styled-components';
import { Helmet } from 'react-helmet';
import { db } from '../firebase/config';
import { addCompletedPoemToUser } from '../firebase/auth';
import { saveCompletedPoem} from '../firebase/poems';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';

// 시 인터페이스 정의 (poems.ts의 인터페이스와 일치하도록)
interface Poem {
  title: string;
  author: string;
  content: string;
  id: string;
  completedUsers?: Array<{ id: string; comment: string }>; // 유저 ID와 댓글을 함께 저장
}

// 스타일 정의
const Container = styled.div`
  max-width: 800px;
  margin: 1rem auto 5rem auto;
  padding: 3rem;
  background-color: #fff;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: top;
  min-height: 170px;
  margin-bottom: 4rem;
`;

const Title = styled.h2`
  color: #000;
  font-size: 3rem;
  font-weight: 900;
  width: 30%;
  white-space: pre-wrap;
  word-break: keep-all;

  letter-spacing: -0.02em;
  line-height: 1.3;
  margin: 0;
`;

const Author = styled.p`
  color: #666;
  font-size: 1rem;
  letter-spacing: 0.01em;
  margin-top: 10px;
`;

const ContentArea = styled.div`
  display: flex;
  gap: 3rem;
  position: relative;
`;

const LeftColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 25px;
`;

const RightColumn = styled.div`
  flex: 3;
  display: flex;
  gap: 2rem;
  flex-direction: column;
  position: relative;
`;

const TypingArea = styled.div`
  margin-top: 10px;
  flex: 1;
  position: relative;
  height: calc(100vh - 300px);
  overflow-y: auto;
  scroll-behavior: smooth;
  background: #fff;
  
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #ccc;
  }
`;

const LineContainer = styled.div`
  position: relative;
  margin-bottom: 0.5rem;
  min-height: fit-content;
  font-size: 1.2rem;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

// 폰트 ID를 실제 폰트 패밀리 이름에 매핑하는 객체 추가
const fontFamilyMap: { [key: string]: string } = {
  'Pretendard-Bold': "'Pretendard-Bold', sans-serif",
  'BookkMyungjo-Bd': "'BookkMyungjo-Bd', serif",
  'MaruBuri': "'MaruBuri', serif",
  'IntelOneMono': "'IntelOneMono', monospace",
  'Shilla_CultureB-Bold': "'Shilla_CultureB-Bold', serif",
  'YESMyoungjo-Regular': "'YESMyoungjo-Regular', serif",
  'MapoFlowerIsland': "'MapoFlowerIsland', serif"
};

// BaseLine, InputLine, OverlayLine, WaitingText 스타일 컴포넌트 수정
const BaseLine = styled.div<{ fontFamily: string }>`
  font-family: ${props => fontFamilyMap[props.fontFamily] || props.fontFamily};
  visibility: hidden;
  font-size: 1.2rem;
  white-space: pre-wrap;
  word-break: break-all;
  width: 100%;
  padding: 0.5rem;
  line-height: 1.5;
  box-sizing: border-box;
  min-height: 2.5rem;
`;

const InputLine = styled.textarea<{ fontFamily: string }>`
  width: 100%;
  padding: 0.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  border: none;
  background-color: transparent;
  outline: none;
  position: absolute;
  top: 0;
  left: 0;
  font-family: ${props => fontFamilyMap[props.fontFamily] || props.fontFamily};
  caret-color: rgb(0, 0, 0);
  color: transparent;
  line-height: 1.5;
  height: 100%;
  resize: none;
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-all;
  box-sizing: border-box;
`;

const OverlayLine = styled.div<{ fontFamily: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0.5rem;
  pointer-events: none;
  font-family: ${props => fontFamilyMap[props.fontFamily] || props.fontFamily};
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
  box-sizing: border-box;
`;

const WaitingText = styled.div<{ fontFamily: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0.5rem;
  pointer-events: none;
  font-family: ${props => fontFamilyMap[props.fontFamily] || props.fontFamily};
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
  color: #ccc;
  box-sizing: border-box;
`;

// 글자 스타일
const Char = styled.span<{ status: 'correct' | 'incorrect' | 'waiting' | 'composing' | 'composing-match' }>`
  ${props => {
    switch (props.status) {
      case 'correct':
        return css`color: rgb(63, 63, 63);`;
      case 'incorrect':
        return css`color: #ff3333;`;
      case 'waiting':
        return css`color: #ccc;`;
      case 'composing':
        return css`color: #4a90e2;`;
      case 'composing-match':
        return css`color: #33a852;`; // 조합 중이지만 초성이 일치할 때
    }
  }}
`;

const ProgressToast = styled.div`
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  background-color: #fff;
  border-radius: 30px;
  box-shadow: 0 4px 6px rgba(115, 115, 115, 0.1);
  color: white;
 
  display: flex;
  align-items: center;
  z-index: 10;
`;

const ProgressBarContainer = styled.div`
  flex: 1;
  height: 4px;
  background-color: #f5f5f5;
  opacity: 0.3;
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ width: number }>`
  width: ${props => `${props.width}%`};
  height: 100%;
  background-color: rgb(73, 92, 75);
  transition: width 0.4s ease;
  border-radius: 2px;
`;

// 폰트 관련
const fontOptions = [
  { id: 'Pretendard-Bold', name: '프리텐다드' },
  { id: 'BookkMyungjo-Bd', name: '부크크 명조' },
  { id: 'MaruBuri', name: '마루부리' },
  { id: 'IntelOneMono', name: 'Intel One Mono' },
  { id: 'Shilla_CultureB-Bold', name: '신라문화체' },
  { id: 'YESMyoungjo-Regular', name: '예스 명조' },
  { id: 'MapoFlowerIsland', name: '마포꽃섬' }
];

const FontSelectorContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 0.5rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
`;

const FontChip = styled.button<{ isSelected: boolean, fontFamily: string }>`
  background: none;
  border: none;
  color: ${props => (props.isSelected ? '#000' : '#999')};
  cursor: pointer;
  font-size: 0.8rem;
  transition: color 0.2s ease;
  padding: 0;
  font-family: ${props => fontFamilyMap[props.fontFamily] || props.fontFamily};
  

  &:hover {
    color: #000;
  }
`;

// '이 시를 적은 사람' 텍스트 스타일
const CompletedUsersText = styled.p`
  color: #666;
  font-size: 0.8rem;
  margin: 0.5em 0;
`;

// 새로고침 아이콘
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="#333" />
  </svg>
);

// 한글 자모 체크 유틸리티 함수
const isKorean = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return (code >= 0xAC00 && code <= 0xD7A3) // 완성형 한글 (가-힣)
    || (code >= 0x3131 && code <= 0x318E); // 자음, 모음 (ㄱ-ㅎ, ㅏ-ㅣ)
};

// 한글 초성 확인 함수
const isKoreanInitial = (char: string): boolean => {
  const initialCode = char.charCodeAt(0);
  // 한글 자음 범위 (ㄱ-ㅎ)
  return initialCode >= 0x3131 && initialCode <= 0x314E;
};

// 한글 모음 확인 함수
const isKoreanVowel = (char: string): boolean => {
  const code = char.charCodeAt(0);
  // 한글 모음 범위 (ㅏ-ㅣ)
  return code >= 0x314F && code <= 0x318E;
};

// 한글 초성 가져오기
const getKoreanInitial = (char: string): string => {
  const code = char.charCodeAt(0);
  
  // 완성형 한글인 경우 (가-힣)
  if (code >= 0xAC00 && code <= 0xD7A3) {
    // 초성 추출 공식: Math.floor((UNI - 0xAC00) / 28 / 21) + 0x1100
    const initialCode = Math.floor((code - 0xAC00) / 28 / 21) + 0x1100;
    
    // ㄱ, ㄲ, ㄴ, ㄷ, ... 등으로 변환하기 위한 매핑
    const initialMap: { [key: number]: string } = {
      0x1100: 'ㄱ', 0x1101: 'ㄲ', 0x1102: 'ㄴ', 0x1103: 'ㄷ', 0x1104: 'ㄸ',
      0x1105: 'ㄹ', 0x1106: 'ㅁ', 0x1107: 'ㅂ', 0x1108: 'ㅃ', 0x1109: 'ㅅ',
      0x110A: 'ㅆ', 0x110B: 'ㅇ', 0x110C: 'ㅈ', 0x110D: 'ㅉ', 0x110E: 'ㅊ',
      0x110F: 'ㅋ', 0x1110: 'ㅌ', 0x1111: 'ㅍ', 0x1112: 'ㅎ'
    };
    
    return initialMap[initialCode] || '';
  }
  
  return '';
};

// 한글 초성, 중성, 종성 추출 함수 추가
const decomposeHangul = (char: string): { initial: string, medial: string, final: string } | null => {
  const code = char.charCodeAt(0);
  
  // 완성형 한글이 아닌 경우
  if (code < 0xAC00 || code > 0xD7A3) {
    return null;
  }
  
  const initialCode = Math.floor((code - 0xAC00) / 28 / 21);
  const medialCode = Math.floor(((code - 0xAC00) / 28) % 21);
  const finalCode = (code - 0xAC00) % 28;
  
  // 초성 배열 (19개)
  const initials = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  // 중성 배열 (21개)
  const medials = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  // 종성 배열 (28개, 첫 번째는 받침 없음)
  const finals = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  
  return {
    initial: initials[initialCode],
    medial: medials[medialCode],
    final: finals[finalCode]
  };
};

// 한글 초성과 중성이 일치하는지 확인하는 함수
const hasSameInitialAndMedial = (char1: string, char2: string): boolean => {
  const comp1 = decomposeHangul(char1);
  const comp2 = decomposeHangul(char2);
  
  if (!comp1 || !comp2) return false;
  
  return comp1.initial === comp2.initial && comp1.medial === comp2.medial;
};

// 복합 모음 관계 매핑 (첫 글자가 두 번째 글자의 부분이 될 수 있는지)
const isPartialVowel = (current: string, target: string): boolean => {
  // 완성형 한글이 아닌 경우 처리 불가
  if (!current || !target) return false;
  
  const currentChar = current.charAt(current.length - 1);
  const targetChar = target.charAt(0);
  
  // 초성 + 모음 상태인 경우 (예: "우"는 "워"의 일부)
  const currentDecomp = decomposeHangul(currentChar);
  const targetDecomp = decomposeHangul(targetChar);
  
  if (!currentDecomp || !targetDecomp) return false;
  
  // 복합 모음 관계 확인 (쌍모음 관계 체크)
  // 'ㅜ'는 'ㅝ'의 일부, 'ㅗ'는 'ㅘ'의 일부 등
  const complexVowelMap: { [key: string]: string[] } = {
    'ㅜ': ['ㅝ', 'ㅞ', 'ㅟ'],
    'ㅗ': ['ㅘ', 'ㅙ', 'ㅚ'],
    'ㅡ': ['ㅢ']
  };
  
  // 초성이 같고, 현재 모음이 복합 모음의 일부인 경우
  if (currentDecomp.initial === targetDecomp.initial) {
    const possibleComplexVowels = complexVowelMap[currentDecomp.medial] || [];
    return possibleComplexVowels.includes(targetDecomp.medial);
  }
  
  return false;
};

// 입력 중인 글자가 목표 글자로 변할 가능성이 있는지 확인
const isPartOfNextChar = (current: string, target: string): boolean => {
  if (!current || !target) return false;
  
  // 1. 초성만 입력된 경우 (ㄱ, ㄴ, ㄷ 등)
  if (isKoreanInitial(current) && getKoreanInitial(target) === current) {
    return true;
  }
  
  // 2. 현재 글자가 목표 글자의 부분인 경우 (복합 모음 고려)
  return isPartialVowel(current, target);
};

// '이 시를 적은 사람' 제목 스타일
const CompletedUsersTitle = styled.h3`
  font-size: 0.8rem;
  color: #757575;
  font-weight: normal;
  letter-spacing: 0.03em;
  margin: 0;
  display: flex;
  align-items: center;
  cursor: pointer;
`;

// '이 시를 적은 사람' 컨테이너 스타일 수정
const CompletedUsersContainer = styled.div`
  margin-top: auto;
  margin-bottom: 0.8rem;
`;

// 새로고침 버튼 스타일 수정
const RefreshButton = styled.button`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  color: #222;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s;
  font-size: 0.9rem;
  letter-spacing: 0.03em;
  background-color: transparent;
  &:hover {
    font-size: 1rem;
  }

  svg path {
    fill: #888;
  }
`;

const ToggleButton = styled.button<{ isOpen: boolean }>`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  transform: rotate(${props => (props.isOpen ? '90deg' : '0deg')});
  transition: transform 0.2s ease;

`;

// 토스트 메시지 스타일
const ToastMessage = styled.div<{ show: boolean }>`
  position: fixed;
  top: ${props => (props.show ? '20px' : '10px')};
  left: 50%;
  transform: translateX(-50%);
  background-color: #000;
  color: white;
  padding: 1rem;
  width: 300px;
  border-radius: 20px;
  font-size: 0.9rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: top 0.5s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.01em;
  span {
    font-size: 0.8rem;
  }
`;

const CommentTextarea = styled.textarea`
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.5rem 0.7rem;
  border-radius: 20px;
  border: 1px solid #ccc;
  resize: none;
  font-size: 0.9rem;
  height: 2.2rem;
  overflow: hidden;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Button = styled.button`
  padding: 0.25rem 0.6rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: background-color 0.2s ease;

  &:first-child {
    background-color: #ccc;
    color: #333;
  }

  &:last-child {
    background-color: #4a90e2;
    color: white;
  }
`;

const CommentBubble = styled.span`
  position: relative;
  display: inline-block;
  cursor: pointer;

  &:hover .comment {
    display: block;
  }

  .comment {
    display: none;
    position: absolute;
    top: -2.4rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: #fff;
    color: #333;
    padding: 0.4rem;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
    z-index: 10;
  }
`;

const PoetryTyping: React.FC = () => {
  const [currentPoem, setCurrentPoem] = useState<Poem | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [selectedFont, setSelectedFont] = useState(fontOptions[0].id);
  const [showCompletion, setShowCompletion] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [lineInputs, setLineInputs] = useState<string[]>([]);
  const [composingLine, setComposingLine] = useState<number | null>(null);
  const lineRefs = useRef<Array<RefObject<HTMLTextAreaElement>>>([]);
  const { currentUser } = useAuth();
  const [completedUserNames, setCompletedUserNames] = useState<{ [key: string]: string }>({});
  const [showAllCompletedToast, setShowAllCompletedToast] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const POEM_COUNT = 20; 
  const [isSticky, setIsSticky] = useState(false);
  const progressWrapperRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const [toastPosition, setToastPosition] = useState({ left: '0', width: '100%' });
  const typingAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (rightColumnRef.current) {
        const width = rightColumnRef.current.offsetWidth;
        document.documentElement.style.setProperty('--right-column-width', `${width}px`);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchPoems = async () => {
      try {
        // URL에서 시 ID 가져오기
        const pathParts = window.location.pathname.split('/');
        const urlPoemId = pathParts[2]; // /poem/2 -> "2"

        if (urlPoemId) {
          console.log('URL에서 가져온 시 ID:', urlPoemId);
          
          // Firestore에서 직접 해당 ID의 시를 가져옴
          const poemDoc = await getDoc(doc(db, 'poems', urlPoemId));
          
          if (poemDoc.exists()) {
            const poemData = poemDoc.data();
            const selectedPoem = {
              id: poemDoc.id,
              ...poemData
            } as Poem;
            
            console.log('파이어스토어에서 가져온 시:', selectedPoem);
            setCurrentPoem(selectedPoem);
            setLineInputs(Array(selectedPoem.content.split('\n').length).fill(''));
            setActiveLineIndex(0);
            setIsComposing(false);
            setProgress(0);
            setShowCompletion(false);
          } else {
            console.error('해당 ID의 시를 찾을 수 없음:', urlPoemId);
          }
        } else {
          // URL에 ID가 없는 경우 전체 시 목록을 가져옴
          const poemsQuery = query(collection(db, 'poems'));
          const poemSnapshot = await getDocs(poemsQuery);
          const poemsList = poemSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Poem[];
          
          setPoems(poemsList);
          const randomId = getRandomPoemId();
          const poemDoc = await getDoc(doc(db, 'poems', randomId));
          if (poemDoc.exists()) {
            const poemData = poemDoc.data();
            const selectedPoem = { id: poemDoc.id, ...poemData } as Poem;
            setCurrentPoem(selectedPoem);
            setLineInputs(Array(selectedPoem.content.split('\n').length).fill(''));
            setActiveLineIndex(0);
            setIsComposing(false);
            setProgress(0);
            setShowCompletion(false);
            console.log('랜덤 시 불러오기 성공:', selectedPoem);
          } else {
            console.error(`랜덤 ID(${randomId})의 시를 찾을 수 없습니다.`);
          }
        }
      } catch (error) {
        console.error('시 가져오기 오류:', error);
      }
    };
    
    fetchPoems();
  }, []);

  useEffect(() => {
    console.log('시 목록 업데이트:', poems);
    if (poems.length > 0 && !currentPoem) {
      loadRandomPoem();
    }
  }, [poems]);

  useEffect(() => {
    if (currentPoem) {
      const lines = currentPoem.content.split('\n');
      lineRefs.current = lines.map(() => createRef<HTMLTextAreaElement>());
    }
  }, [currentPoem]);

  const poemLines = currentPoem?.content.split('\n') || [];

  useEffect(() => {
    if (!currentPoem || showCompletion || isCompleted) return;

    // 빈 줄을 제외한 실제 시 내용이 있는 줄만 비교
    const meaningfulLines = poemLines.map((line, i) => ({
      index: i,
      line: line.replace(/\s+/g, ' ').trim(),
      input: (lineInputs[i] || '').replace(/\s+/g, ' ').trim()
    })).filter(({ line }) => line !== '');

    console.log('의미있는 줄 검사:', meaningfulLines.map(l => ({
      index: l.index,
      line: l.line,
      input: l.input,
      isMatch: l.line === l.input
    })));

    // 모든 줄이 정확히 일치하는지 확인
    const allCorrect = meaningfulLines.every(({ line, input }) => line === input);
    
    console.log('완성 체크:', {
      totalLines: poemLines.length,
      meaningfulLines: meaningfulLines.length,
      allCorrect,
      lineInputs
    });

    if (allCorrect && meaningfulLines.length > 0) {
      console.log('모든 줄이 정확히 입력됨, 완료 처리 시작');
      handleCompletion();
    }
  }, [lineInputs, poemLines, currentPoem, showCompletion, isCompleted]);

  // 자동 스크롤 함수 수정
  const checkAndScroll = (index: number) => {
    requestAnimationFrame(() => {
      const lineElement = lineRefs.current[index]?.current;
      if (!lineElement) return;

      // viewport 기준으로 현재 입력 라인의 위치 계산
      const lineRect = lineElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // 현재 입력 라인이 viewport 기준으로 어디에 있는지 계산 (0~1 사이의 값)
      const linePositionInViewport = lineRect.top / viewportHeight;

      // 입력 라인이 viewport의 70% 아래에 있으면 스크롤
      if (linePositionInViewport > 0.7) {
        // 입력 라인을 viewport의 30% 위치로 스크롤
        const targetPosition = viewportHeight * 0.3;
        const scrollAmount = window.scrollY + (lineRect.top - targetPosition);

        window.scrollTo({
          top: scrollAmount,
          behavior: 'smooth'
        });
      }
    });
  };

  // handleLineInput 함수 수정
  const handleLineInput = (index: number, value: string) => {
    const newLineInputs = [...lineInputs];
    newLineInputs[index] = value;
    setLineInputs(newLineInputs);
    
    updateProgressSimple(newLineInputs);
    checkAndScroll(index);
    
    if (index === poemLines.length - 1) {
      const isComplete = checkCompletion(newLineInputs, poemLines);
      if (isComplete && !showCompletion) {
        handleCompletion();
      }
    }
  };

  // handleKeyDown 함수 수정
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const currentLine = poemLines[index] || '';
    if (currentLine.trim() === '' && e.key !== 'Backspace') {
      if (index < poemLines.length - 1) {
        setTimeout(() => {
          setActiveLineIndex(index + 1);
          lineRefs.current[index + 1]?.current?.focus();
          checkAndScroll(index + 1);
        }, 10);
        return;
      }
    }
    
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      
      if (index < poemLines.length - 1) {
        let nextContentIndex = index + 1;
        
        while (
          nextContentIndex < poemLines.length - 1 && 
          poemLines[nextContentIndex].trim() === ''
        ) {
          nextContentIndex++;
        }
        
        setActiveLineIndex(nextContentIndex);
        setTimeout(() => {
          lineRefs.current[nextContentIndex]?.current?.focus();
          checkAndScroll(nextContentIndex);
        }, 0);
      } 
      else if (!showCompletion) {
        handleCompletion();
      }
    }
    
    if (e.key === 'Backspace' && !isComposing) {
      const currentInput = lineInputs[index] || '';
      
      if (currentInput === '' && index > 0) {
        e.preventDefault();
        
        setActiveLineIndex(index - 1);
        
        setTimeout(() => {
          const prevInput = lineRefs.current[index - 1]?.current;
          if (prevInput) {
            prevInput.focus();
            checkAndScroll(index - 1);
            
            const inputLength = lineInputs[index - 1]?.length || 0;
            if (inputLength > 0) {
              prevInput.setSelectionRange(inputLength, inputLength);
            }
          }
        }, 0);
      }
    }
  };

  const handleCompositionStart = (index: number) => {
    setIsComposing(true);
    setComposingLine(index);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
    setComposingLine(null);
  };

  const handleFontChange = (fontId: string) => {
    console.log('폰트 변경:', fontId);
    setSelectedFont(fontId);
  };

  const getRandomPoemId = () => {
    const randomNumber = Math.floor(Math.random() * POEM_COUNT) + 1; // 1 ~ POEM_COUNT
    return String(randomNumber); 
  };
  
  const loadRandomPoem = async () => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'poem' && pathParts[2]) {
      window.location.href = '/';
      return;
    }

    const randomId = getRandomPoemId();
    try {
      const poemDoc = await getDoc(doc(db, 'poems', randomId));
      if (poemDoc.exists()) {
        const poemData = poemDoc.data();
        const selectedPoem = { id: poemDoc.id, ...poemData } as Poem;
        setCurrentPoem(selectedPoem);
        setLineInputs(Array(selectedPoem.content.split('\n').length).fill(''));
        setActiveLineIndex(0);
        setIsComposing(false);
        setProgress(0);
        setShowCompletion(false);
        console.log('랜덤 시 불러오기 성공:', selectedPoem);
      } else {
        console.error(`랜덤 ID(${randomId})의 시를 찾을 수 없습니다.`);
      }
    } catch (error) {
      console.error('랜덤 시 불러오기 실패:', error);
    }
  };
  
  const renderLine = (line: string, index: number) => {
    const input = lineInputs[index] || '';
    const isActive = index === activeLineIndex;
    const isComposing = index === composingLine;

    return (
      <LineContainer key={index} onClick={() => {
        setActiveLineIndex(index);
        lineRefs.current[index]?.current?.focus();
      }}>
        <BaseLine fontFamily={selectedFont}>{line}</BaseLine>
        <InputLine
          ref={lineRefs.current[index]}
          value={input}
          onChange={(e) => handleLineInput(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onCompositionStart={() => handleCompositionStart(index)}
          onCompositionEnd={handleCompositionEnd}
          disabled={!isActive}
          autoFocus={isActive && index === 0}
          spellCheck={false}
          autoComplete="off"
          data-line-index={index}
          fontFamily={selectedFont}
        />
        
        <WaitingText fontFamily={selectedFont}>
          {line}
        </WaitingText>
        
        <OverlayLine fontFamily={selectedFont}>
          {line.substring(0, input.length).split('').map((char, i) => {
            const currentChar = input[i];
            const targetChar = line[i];
            const nextChar = line[i + 1];
              
            if (isComposing && i === input.length - 1) {
              if (isKoreanInitial(currentChar)) {
                const targetInitial = getKoreanInitial(targetChar);
                return <Char key={i} status={currentChar === targetInitial ? 'correct' : 'incorrect'}>{currentChar}</Char>;
              }
                
              const currentCode = currentChar.charCodeAt(0);
              const targetCode = targetChar.charCodeAt(0);
                
              if (currentCode >= 0xAC00 && currentCode <= 0xD7A3 &&
                  targetCode >= 0xAC00 && targetCode <= 0xD7A3) {
                if (hasSameInitialAndMedial(currentChar, targetChar)) {
                  return <Char key={i} status="correct">{currentChar}</Char>;
                }
              }
              
              if (isPartOfNextChar(currentChar, targetChar)) {
                return <Char key={i} status="correct">{currentChar}</Char>;
              }
              
              if (nextChar && isPartOfNextChar(currentChar, nextChar)) {
                return <Char key={i} status="correct">{currentChar}</Char>;
              }
                
              return <Char key={i} status="incorrect">{currentChar}</Char>;
            }
              
            return <Char key={i} status={currentChar === targetChar ? 'correct' : 'incorrect'}>{currentChar}</Char>;
          })}
        </OverlayLine>
      </LineContainer>
    );
  };

  const handleCompletion = async () => {
    if (showCompletion || isCompleted) return;
    
    console.log('완료 처리 중...');
    setShowCompletion(true);
    setIsCompleted(true);
    setProgress(100);
    
  
    if (!currentPoem || !currentUser) return;
    
    try {

    } catch (error) {
      console.error('시 완료 저장 중 오류 발생:', error);
    }
  };

  const fetchUserNicknames = async (userIds: string[]) => {
    if (!userIds.length) return;
    
    try {
      const nicknames: { [key: string]: string } = {};
      
      await Promise.all(
        userIds.map(async (userId) => {
          if (nicknames[userId]) return;
          
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            nicknames[userId] = userData.nickname || userData.displayName || userId.substring(0, 8);
          } else {
            nicknames[userId] = userId.substring(0, 8);
          }
        })
      );
      
      setCompletedUserNames(nicknames);
    } catch (error) {
      console.error('사용자 닉네임 가져오기 오류:', error);
    }
  };

  useEffect(() => {
    if (currentPoem?.completedUsers && currentPoem.completedUsers.length > 0) {
      const userIds = currentPoem.completedUsers.map(user => user.id);
      fetchUserNicknames(userIds);
    }
  }, [currentPoem]);
  

  const toggleUsers = () => {
    setIsUsersOpen(prev => !prev);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleCommentSubmit = async () => {
    if (!currentPoem || !currentUser) return;

    try {
      const updatedCompletedUsers = currentPoem.completedUsers?.map(user =>
        user.id === currentUser.uid ? { ...user, comment } : user
      ) || [];

      if (!updatedCompletedUsers.some(user => user.id === currentUser.uid)) {
        updatedCompletedUsers.push({ id: currentUser.uid, comment });
      }

      await saveCompletedPoem(currentUser.uid, currentPoem.id, comment);
      await addCompletedPoemToUser(currentUser.uid, currentPoem.id);
      setCurrentPoem(prev => {
        if (!prev) return null;
        return {
          ...prev,
          completedUsers: updatedCompletedUsers
        };
      });

      setComment('');
      setShowCompletion(false);
      console.log('토스트바 숨김 처리 완료');
      setIsUsersOpen(true);
    } catch (error) {
      console.error('댓글 저장 중 오류 발생:', error);
    }
  };

  const handleOkayClick = () => {
    if (!currentPoem || !currentUser) return;

    const updatedCompletedUsers = currentPoem.completedUsers?.map(user =>
      user.id === currentUser.uid ? { ...user, comment: '' } : user
    ) || [];

    if (!updatedCompletedUsers.some(user => user.id === currentUser.uid)) {
      updatedCompletedUsers.push({ id: currentUser.uid, comment: '' });
    }

    setCurrentPoem(prev => {
      if (!prev) return null;
      return {
        ...prev,
        completedUsers: updatedCompletedUsers
      };
    });

    setShowCompletion(false);
    setComment('');
    console.log('토스트바 숨김 처리 완료');
    setIsUsersOpen(true);
  };

  useEffect(() => {
    console.log('showCompletion 상태:', showCompletion);
  }, [showCompletion]);

  // 완성 체크 함수
  const checkCompletion = (inputs: string[], lines: string[]): boolean => {
    const meaningfulPairs = lines.map((line, i) => ({
      line: line.replace(/\s+/g, ' ').trim(),
      input: (inputs[i] || '').replace(/\s+/g, ' ').trim()
    })).filter(({ line }) => line !== '');

    return meaningfulPairs.length > 0 && meaningfulPairs.every(({ line, input }) => line === input);
  };

  // 진행률 업데이트 함수
  const updateProgressSimple = (inputs: string[] = lineInputs) => {
    if (!currentPoem) return;
    
    const totalLines = poemLines.length;
    if (totalLines === 0) return;
    
    let totalProgress = 0;
    
    poemLines.forEach((line, idx) => {
      const input = inputs[idx] || '';
      const lineProgress = Math.min(input.length / Math.max(line.length, 1), 1);
      totalProgress += lineProgress;
    });
    
    const avgProgress = (totalProgress / totalLines) * 100;
    setProgress(Math.min(avgProgress, 100));
  };

  return (
    <Container>
      {showAllCompletedToast && (
        <ToastMessage show={true}>
          모든 시를 타이핑 했어요! 🙊
        </ToastMessage>
      )}

      {showCompletion && (
        <ToastMessage show={true}>
          시를 완성했어요! 🎉
          {currentUser ? (
            <>
              <span>한줄평을 남길 수 있어요!</span>
              <CommentTextarea 
                value={comment} 
                onChange={handleCommentChange} 
                placeholder="한줄평을 입력하세요...(15자 이내)"
                maxLength={15}
              />
              <ButtonContainer>
                <Button onClick={handleOkayClick} disabled={comment.trim() !== ''}>괜찮아요</Button>
                <Button onClick={handleCommentSubmit}>등록</Button>
              </ButtonContainer>
            </>
          ) : (
            <span>로그인하면 감상평을 남길 수 있어요!</span>
          )}
        </ToastMessage>
      )}

      <Header>
        {currentPoem && (
          <>
            <Title>{currentPoem.title}</Title>
            <Author>{currentPoem.author}</Author>
          </>
        )}
      </Header>
    
      <ContentArea>
        <LeftColumn>
          <RefreshButton onClick={loadRandomPoem}>
              <RefreshIcon />
              새로운 시
            </RefreshButton>  
            <FontSelectorContainer>
              {fontOptions.map((font, index) => (
                <React.Fragment key={font.id}>
                  <FontChip 
                    isSelected={selectedFont === font.id}
                    onClick={() => handleFontChange(font.id)}
                    className={font.id}
                    type="button"
                    fontFamily={font.id}
                  >
                    {font.name}
                  </FontChip>
                  {index < fontOptions.length - 1 && <span style={{ margin: '0' , color: '#888', fontSize: '0.8rem'}}>/</span>}
                </React.Fragment>
              ))}
            </FontSelectorContainer>

          <CompletedUsersContainer>
            <CompletedUsersTitle onClick={toggleUsers}>
              <ToggleButton isOpen={isUsersOpen}>▶</ToggleButton>
              이 시를 적은 사람
              
            </CompletedUsersTitle>
            {isUsersOpen && (
              <CompletedUsersText>
                {Object.keys(completedUserNames).length === 0 ? (
                  <span>'{currentPoem?.title}'의 첫번째 타이퍼가 되어주세요 ✍🏻</span>
                ) : (
                  currentPoem?.completedUsers?.map(({ id, comment }, index, array) => (
                    <CommentBubble key={id}>
                      {completedUserNames[id]} {comment && <span>💭</span>}&nbsp;&nbsp;
                      {comment && <span className="comment">{comment}</span>}
                      
                    </CommentBubble>
                  ))
                )}
              </CompletedUsersText>
            )}
          </CompletedUsersContainer>
        </LeftColumn>

        <RightColumn ref={rightColumnRef}>
          <ProgressToast>
            <ProgressBarContainer>
              <ProgressBar width={progress} />
            </ProgressBarContainer>
          </ProgressToast>

          <TypingArea ref={typingAreaRef}>
            {poemLines.map((line, index) => renderLine(line, index))}
          </TypingArea>

        </RightColumn>
      </ContentArea>

    </Container>
  );
};

export default PoetryTyping; 