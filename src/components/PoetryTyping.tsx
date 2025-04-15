import React, { useState, useRef, useEffect, createRef, RefObject } from 'react';
import styled, { css } from 'styled-components';
import poems from '../data/poems';
import { auth, db } from '../firebase/config';
import { addCompletedPoem } from '../firebase/auth';
import { saveCompletedPoem, getCompletedUserIds } from '../firebase/poems';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';

// 시 인터페이스 정의 (poems.ts의 인터페이스와 일치하도록)
interface Poem {
  title: string;
  author: string;
  content: string;
  id: string;
  completedUsers?: string[];
}

// 스타일 정의
const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 3rem 4rem;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  font-family: 'YESMyoungjo-Regular', serif;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 0.5rem;
  color: #212121;
  font-size: 2rem;
  font-weight: 500;
  letter-spacing: -0.02em;
`;

const Author = styled.p`
  text-align: center;
  margin-bottom: 3rem;
  color: #757575;
  font-size: 1rem;
  letter-spacing: 0.01em;
  font-style: normal;
  position: relative;
  
  &:after {
    content: '';
    display: block;
    width: 40px;
    height: 1px;
    background-color: #ddd;
    margin: 1.5rem auto 0;
  }
`;

const TypingArea = styled.div`
  margin-bottom: 3rem;
  padding: 0 1rem;
`;

const LineContainer = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
  min-height: 2.5rem;
  line-height: 1.7;
`;

// 폰트 ID를 실제 폰트 패밀리 이름에 매핑하는 객체 추가
const fontFamilyMap: { [key: string]: string } = {
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
  white-space: pre-wrap;
  height: 0;
  width: 100%;
  padding: 0.5rem;
  line-height: 1.5;
`;

const InputLine = styled.input<{ fontFamily: string }>`
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  border: none;
  background-color: transparent;
  outline: none;
  position: absolute;
  top: 0;
  left: 0;
  font-family: ${props => fontFamilyMap[props.fontFamily] || props.fontFamily};
  caret-color: #4a90e2;
  color: transparent;
  line-height: 1.5;
`;

const OverlayLine = styled.div<{ fontFamily: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 0.5rem;
  pointer-events: none;
  font-family: ${props => fontFamilyMap[props.fontFamily] || props.fontFamily};
  white-space: pre-wrap;
  line-height: 1.5;
`;

const WaitingText = styled.div<{ fontFamily: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 0.5rem;
  pointer-events: none;
  font-family: ${props => fontFamilyMap[props.fontFamily] || props.fontFamily};
  white-space: pre-wrap;
  line-height: 1.5;
  color: #ccc;
`;

// 글자 스타일
const Char = styled.span<{ status: 'correct' | 'incorrect' | 'waiting' | 'composing' | 'composing-match' }>`
  ${props => {
    switch (props.status) {
      case 'correct':
        return css`color: #000;`;
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

const ProgressBar = styled.div`
  width: 100%;
  height: 2px;
  background-color: #f5f5f5;
  margin-bottom: 3rem;
  overflow: hidden;
`;

const Progress = styled.div<{ width: number }>`
  height: 100%;
  width: ${props => `${props.width}%`};
  background-color: #212121;
  transition: width 0.4s ease;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.2rem;
  background-color: transparent;
  color: #212121;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  cursor: pointer;
  margin: 2rem auto;
  transition: all 0.3s;
  font-size: 0.9rem;
  letter-spacing: 0.03em;

  &:hover {
    background-color: #f9f9f9;
    border-color: #bdbdbd;
  }
`;

const CompletionMessage = styled.div<{ show: boolean }>`
  text-align: center;
  margin: 3rem auto;
  padding: 2rem;
  background-color: #f9f9f9;
  border-left: 3px solid #212121;
  color: #212121;
  display: ${props => (props.show ? 'block' : 'none')};
  animation: fadeIn 1s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  h2 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 500;
    letter-spacing: -0.01em;
  }
  
  p {
    font-size: 1rem;
    line-height: 1.6;
  }
`;

// 폰트 관련
const fontOptions = [
  { id: 'BookkMyungjo-Bd', name: '부크크 명조' },
  { id: 'MaruBuri', name: '마루부리' },
  { id: 'IntelOneMono', name: 'Intel One Mono' },
  { id: 'Shilla_CultureB-Bold', name: '신라문화체' },
  { id: 'YESMyoungjo-Regular', name: '예스 명조' },
  { id: 'MapoFlowerIsland', name: '마포꽃섬' }
];

const FontSelectorContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.8rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -1.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 1px;
    background-color: #eee;
  }
`;

const FontChip = styled.button<{ isSelected: boolean }>`
  padding: 0.5rem 0.8rem;
  border: none;
  border-radius: 0;
  background-color: transparent;
  color: ${props => (props.isSelected ? '#212121' : '#9e9e9e')};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  font-size: 0.9rem;
  
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: ${props => (props.isSelected ? '100%' : '0')};
    height: 1px;
    background-color: ${props => (props.isSelected ? '#212121' : 'transparent')};
    transition: all 0.2s ease;
  }

  &:hover {
    color: #212121;
    
    &:after {
      width: 100%;
      background-color: #e0e0e0;
    }
  }

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

  &:focus {
    outline: none;
  }
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

// 칩 컨테이너 스타일
const CompletedUsersContainer = styled.div`
  margin: 3rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CompletedUsersTitle = styled.h3`
  font-size: 0.9rem;
  color: #757575;
  margin-bottom: 1rem;
  font-weight: normal;
  letter-spacing: 0.03em;
`;

const UserChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
`;

const UserChip = styled.div<{ isCurrentUser: boolean }>`
  padding: 0.3rem 0.7rem;
  background-color: ${props => props.isCurrentUser ? '#f5f5f5' : 'transparent'};
  color: ${props => props.isCurrentUser ? '#212121' : '#757575'};
  border: 1px solid ${props => props.isCurrentUser ? '#e0e0e0' : '#eee'};
  border-radius: 2px;
  font-size: 0.8rem;
  white-space: nowrap;
  display: flex;
  align-items: center;
`;

// 토스트 메시지 스타일 추가
const ToastMessage = styled.div<{ show: boolean }>`
  position: fixed;
  top: ${props => (props.show ? '20px' : '-100px')};
  left: 50%;
  transform: translateX(-50%);
  background-color: #212121;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 2px;
  font-size: 0.9rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transition: top 0.5s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.01em;
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
  const lineRefs = useRef<Array<RefObject<HTMLInputElement>>>([]);
  const { currentUser } = useAuth();
  const [completedUserNames, setCompletedUserNames] = useState<{ [key: string]: string }>({});
  const [showAllCompletedToast, setShowAllCompletedToast] = useState(false);

  // 시 목록 가져오기
  useEffect(() => {
    const fetchPoems = async () => {
      try {
        const poemsQuery = query(collection(db, 'poems'));
        const poemSnapshot = await getDocs(poemsQuery);
        const poemsList = poemSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Poem[];
        setPoems(poemsList);
      } catch (error) {
        console.error('시 목록 가져오기 오류:', error);
      }
    };
    fetchPoems();
  }, []);

  // 시 목록이 업데이트되면 자동으로 시를 불러옵니다
  useEffect(() => {
    if (poems.length > 0 && !currentPoem) {
      loadNextPoem();
    }
  }, [poems]);

  // refs 초기화
  useEffect(() => {
    if (currentPoem) {
      const lines = currentPoem.content.split('\n');
      lineRefs.current = lines.map(() => createRef<HTMLInputElement>());
    }
  }, [currentPoem]);

  const poemLines = currentPoem?.content.split('\n') || [];

  // 모든 줄이 정확히 입력되었는지 확인하고 축하 메시지 표시
  useEffect(() => {
    if (!currentPoem || showCompletion) return;
    
    // 앞뒤 공백을 제거하고 비교
    const allLinesCorrect = poemLines.every((line, i) => {
      const cleanLine = line.trim();
      const cleanInput = (lineInputs[i] || '').trim();
      return cleanInput === cleanLine;
    });
    
    if (allLinesCorrect && lineInputs.length === poemLines.length && lineInputs.some(input => input.trim() !== '')) {
      handleCompletion();
    }
  }, [lineInputs, poemLines, currentPoem, showCompletion]);

  // 라인 입력 핸들러
  const handleLineInput = (index: number, value: string) => {
    const newLineInputs = [...lineInputs];
    newLineInputs[index] = value;
    setLineInputs(newLineInputs);
    
    // 진행률 업데이트
    updateProgressSimple(newLineInputs);
    
    // 마지막 줄이고, 마지막 글자가 일치하면 완료 처리
    if (index === poemLines.length - 1) {
      const targetLine = poemLines[index];
      // 마지막 글자까지 입력했는지 확인
      if (value.length >= targetLine.length) {
        // 모든 줄이 충분히 입력되었는지 확인
        const allLinesHaveInput = newLineInputs.every((input, i) => {
          const line = poemLines[i] || '';
          return input && input.length >= line.length;
        });
        
        if (allLinesHaveInput && !showCompletion) {
          console.log('완료 조건 충족!');
          setTimeout(() => {
            handleCompletion();
          }, 300);
        }
      }
    }
  };
  
  // 간단한 진행률 계산 함수
  const updateProgressSimple = (inputs: string[] = lineInputs) => {
    if (!currentPoem) return;
    
    // 전체 라인 수
    const totalLines = poemLines.length;
    if (totalLines === 0) return;
    
    // 각 라인별 진행률 계산
    let totalProgress = 0;
    
    poemLines.forEach((line, idx) => {
      const input = inputs[idx] || '';
      const lineProgress = Math.min(input.length / Math.max(line.length, 1), 1);
      totalProgress += lineProgress;
    });
    
    // 전체 진행률 계산 (0~100%)
    const avgProgress = (totalProgress / totalLines) * 100;
    setProgress(Math.min(avgProgress, 100));
  };

  // 키 입력 핸들러
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // 빈 줄 자동 건너뛰기
    const currentLine = poemLines[index] || '';
    if (currentLine.trim() === '' && e.key !== 'Backspace') {
      if (index < poemLines.length - 1) {
        setTimeout(() => {
          setActiveLineIndex(index + 1);
          lineRefs.current[index + 1]?.current?.focus();
        }, 10);
        return;
      }
    }
    
    // 엔터 키를 눌렀을 때
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      
      // 다음 라인으로 이동 (마지막 라인이 아닌 경우)
      if (index < poemLines.length - 1) {
        // 다음 내용이 있는 줄 찾기 (항상 빈 줄은 건너뛰기)
        let nextContentIndex = index + 1;
        
        // 바로 다음 줄이 빈 줄이면 그 다음 내용이 있는 줄 찾기
        if (poemLines[nextContentIndex].trim() === '') {
          // 내용이 있는 다음 줄 찾기
          while (
            nextContentIndex < poemLines.length - 1 && 
            poemLines[nextContentIndex].trim() === ''
          ) {
            nextContentIndex++;
          }
        }
        
        // 다음 내용이 있는 줄로 이동
        setActiveLineIndex(nextContentIndex);
        setTimeout(() => {
          lineRefs.current[nextContentIndex]?.current?.focus();
        }, 0);
      } 
      // 마지막 라인에서 엔터 누르면 강제로 완료 처리
      else if (!showCompletion) {
        handleCompletion();
      }
    }
    
    // 백스페이스 키를 눌렀을 때 이전 줄로 이동
    if (e.key === 'Backspace' && !isComposing) {
      const currentInput = lineInputs[index] || '';
      
      // 현재 입력이 비어있고, 첫 번째 줄이 아닌 경우
      if (currentInput === '' && index > 0) {
        e.preventDefault(); // 백스페이스 키의 기본 동작 방지
        
        // 이전 라인으로 이동
        setActiveLineIndex(index - 1);
        
        // 이전 라인으로 포커스 이동
        setTimeout(() => {
          const prevInput = lineRefs.current[index - 1]?.current;
          if (prevInput) {
            prevInput.focus();
            
            // 입력 값의 길이가 있는 경우 커서를 맨 끝으로 이동
            const inputLength = lineInputs[index - 1]?.length || 0;
            if (inputLength > 0) {
              prevInput.setSelectionRange(inputLength, inputLength);
            }
          }
        }, 0);
      }
    }
  };

  // 조합 시작
  const handleCompositionStart = (index: number) => {
    setIsComposing(true);
    setComposingLine(index);
  };

  // 조합 종료
  const handleCompositionEnd = () => {
    setIsComposing(false);
    setComposingLine(null);
  };

  // 폰트 변경 핸들러
  const handleFontChange = (fontId: string) => {
    console.log('폰트 변경:', fontId);
    setSelectedFont(fontId);
  };

  // 새로운 시 불러오기
  const loadNextPoem = async () => {
    try {
      const selectedPoem = await getSelectedPoem(poems);
      if (selectedPoem) {
        setCurrentPoem(selectedPoem);
        setLineInputs(Array(selectedPoem.content.split('\n').length).fill(''));
        setActiveLineIndex(0);
        setIsComposing(false);
        setProgress(0);
        setShowCompletion(false);
      }
    } catch (error) {
      console.error('다음 시 로드 중 오류 발생:', error);
    }
  };

  // 랜덤 시 선택 (ID 할당 보장)
  const getSelectedPoem = async (poemsList: Poem[]) => {
    // 완료하지 않은 시들 중에서 랜덤으로 선택
    const uncompletedPoems = poemsList.filter(poem => 
      !poem.completedUsers?.includes(currentUser?.uid || '')
    );

    // 모든 시를 완료한 경우
    if (uncompletedPoems.length === 0) {
      // 토스트 메시지 표시
      setShowAllCompletedToast(true);
      
      // 3초 후에 토스트 메시지 숨기기
      setTimeout(() => {
        setShowAllCompletedToast(false);
      }, 5000);
      
      // 모든 시 중에서 랜덤으로 선택
      const randomIndex = Math.floor(Math.random() * poemsList.length);
      return poemsList[randomIndex] || null;
    }

    const randomIndex = Math.floor(Math.random() * uncompletedPoems.length);
    const selectedPoem = uncompletedPoems[randomIndex];
    
    return selectedPoem;
  };

  // 라인 렌더링
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
        
        {/* 대기 중인 텍스트 (회색 글자) */}
        <WaitingText fontFamily={selectedFont}>
          {line}
        </WaitingText>
        
        {/* 입력한 텍스트 (검정/빨강 글자) */}
        <OverlayLine fontFamily={selectedFont}>
          {line.substring(0, input.length).split('').map((char, i) => {
            const currentChar = input[i];
            const targetChar = line[i];
            const nextChar = line[i + 1];
              
            // 현재 조합 중 + 마지막 입력 글자일 때
            if (isComposing && i === input.length - 1) {
              // 1. 초성만 입력된 경우: 목표 글자의 초성과 일치해야 검은색
              if (isKoreanInitial(currentChar)) {
                const targetInitial = getKoreanInitial(targetChar);
                return <Char key={i} status={currentChar === targetInitial ? 'correct' : 'incorrect'}>{currentChar}</Char>;
              }
                
              // 2. 조합 중인 글자 처리 - 목표 글자와 초성+중성이 일치하는지 확인
              const currentCode = currentChar.charCodeAt(0);
              const targetCode = targetChar.charCodeAt(0);
                
              // 둘 다 완성형 한글인 경우 초성+중성 비교
              if (currentCode >= 0xAC00 && currentCode <= 0xD7A3 &&
                  targetCode >= 0xAC00 && targetCode <= 0xD7A3) {
                if (hasSameInitialAndMedial(currentChar, targetChar)) {
                  return <Char key={i} status="correct">{currentChar}</Char>;
                }
              }
              
              // 3. 복합 모음 관계 처리 (예: "우"가 "워"의 부분)
              // 현재 글자가 목표 글자의 부분인 경우
              if (isPartOfNextChar(currentChar, targetChar)) {
                return <Char key={i} status="correct">{currentChar}</Char>;
              }
              
              // 4. 다음 글자의 부분인 경우 (예: "우"가 다음 글자 "워"의 부분)
              if (nextChar && isPartOfNextChar(currentChar, nextChar)) {
                return <Char key={i} status="correct">{currentChar}</Char>;
              }
                
              // 5. 초성과 중성이 목표 글자와 다르면 틀린 것으로 표시
              return <Char key={i} status="incorrect">{currentChar}</Char>;
            }
              
            // 조합이 완료된 글자는 정확히 일치하는지 확인
            return <Char key={i} status={currentChar === targetChar ? 'correct' : 'incorrect'}>{currentChar}</Char>;
          })}
        </OverlayLine>
      </LineContainer>
    );
  };

  // 완료 처리 함수
  const handleCompletion = async () => {
    // 이미 완료 메시지가 표시되고 있으면 중복 실행 방지
    if (showCompletion) return;
    
    console.log('축하 메시지 표시!');
    setShowCompletion(true);
    setProgress(100);
    
    // 현재 사용자와 시가 있는 경우에만 저장 처리
    if (!currentPoem || !currentUser) return;
    
    try {
      // 시 완료 저장 - completedUsers 배열에 사용자 ID 추가
      await saveCompletedPoem(
        currentUser.uid,
        currentPoem.id
      );
      
      // 사용자 통계 업데이트
      await addCompletedPoem(currentUser.uid, currentPoem.id);
      
      // 현재 시 업데이트 - 완료한 사용자 추가
      setCurrentPoem(prev => {
        if (!prev) return null;
        const completedUsers = prev.completedUsers || [];
        return {
          ...prev,
          completedUsers: [...completedUsers, currentUser.uid]
        };
      });
    } catch (error) {
      console.error('시 완료 저장 중 오류 발생:', error);
    }
  };

  // 사용자 닉네임 가져오기 함수
  const fetchUserNicknames = async (userIds: string[]) => {
    if (!userIds.length) return;
    
    try {
      const nicknames: { [key: string]: string } = {};
      
      for (const userId of userIds) {
        // 이미 가져온 사용자는 건너뛰기
        if (nicknames[userId]) continue;
        
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          nicknames[userId] = userData.nickname || userData.displayName || userId.substring(0, 8);
        } else {
          nicknames[userId] = userId.substring(0, 8);
        }
      }
      
      setCompletedUserNames(nicknames);
    } catch (error) {
      console.error('사용자 닉네임 가져오기 오류:', error);
    }
  };

  // 시가 로드되면 완료한 사용자 정보 가져오기
  useEffect(() => {
    if (currentPoem?.completedUsers && currentPoem.completedUsers.length > 0) {
      fetchUserNicknames(currentPoem.completedUsers);
    }
  }, [currentPoem]);

  return (
    <Container>
      {/* 토스트 메시지 */}
      <ToastMessage show={showAllCompletedToast}>
        모든 시를 타이핑 했어요! 🙊
      </ToastMessage>
      
      <FontSelectorContainer>
        {fontOptions.map(font => (
          <FontChip 
            key={font.id}
            isSelected={selectedFont === font.id}
            onClick={() => handleFontChange(font.id)}
            className={font.id}
            type="button"
          >
            {font.name}
          </FontChip>
        ))}
      </FontSelectorContainer>

      {currentPoem ? (
        <>
          <Title>{currentPoem.title}</Title>
          <Author>{currentPoem.author}</Author>
          
          <ProgressBar>
            <Progress width={progress} />
          </ProgressBar>

          <TypingArea>
            {poemLines.map((line, index) => renderLine(line, index))}
          </TypingArea>

          <RefreshButton onClick={loadNextPoem}>
            새로운 시 불러오기
          </RefreshButton>

          {/* 완료한 사용자 목록 표시 */}
          {currentPoem.completedUsers && currentPoem.completedUsers.length > 0 && (
            <CompletedUsersContainer>
              <CompletedUsersTitle>이 시를 완료한 사용자</CompletedUsersTitle>
              <UserChipsContainer>
                {/* 중복 제거를 위해 filter 사용 */}
                {currentPoem.completedUsers
                  .filter((userId, index, self) => self.indexOf(userId) === index)
                  .map((userId, index) => (
                    <UserChip 
                      key={index}
                      isCurrentUser={userId === currentUser?.uid}
                    >
                      {completedUserNames[userId] || '사용자'}
                    </UserChip>
                  ))}
              </UserChipsContainer>
            </CompletedUsersContainer>
          )}

          <CompletionMessage show={showCompletion}>
            <h2>🎉 축하합니다! 🎉</h2>
            <p>성공적으로 시를 완성하셨습니다!</p>
            <p>"{currentPoem.title}" - {currentPoem.author}</p>
          </CompletionMessage>
        </>
      ) : (
        <p>시를 불러오는 중...</p>
      )}
    </Container>
  );
};

export default PoetryTyping; 