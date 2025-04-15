import React, { useState, useEffect, useRef, createRef, RefObject } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

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
    font-family: 'intelone-mono-font-family-italic';
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
`;

const AppContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  background-color: rgb(255, 255, 255);
  min-height: 100vh;
  color: #000;
`;

const Title = styled.h1`
  color: black;
  margin-bottom: 1rem;
`;

const FontSelectorContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
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
  
  &.intelone-mono-font-family-italic {
    font-family: 'intelone-mono-font-family-italic', monospace;
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
      case 'composing': return 'black'; // 조합 중인 글자는 연한 녹색
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
  { id: 'intelone-mono-font-family-italic', name: 'Intel One Mono' },
  { id: 'Shilla_CultureB-Bold', name: '신라문화체' },
  { id: 'YESMyoungjo-Regular', name: '예스 명조' },
  { id: 'MapoFlowerIsland', name: '마포꽃섬' }
];

const poems = [
  {
    title: '대화',
    content: `사랑을 잃고 나는 쓰네
잘 있거라, 짧았던 밤들아
창밖을 떠돌던 겨울 안개들아
아무것도 모르던 촛불들아, 잘 있거라
공포를 기다리던 흰 종이들아
말설임을 대신하던 눈물들아
잘 있거라, 더 이상 내 것이 아닌 열망들아
장님처럼 나 이제 더듬거리며 문을 잠그네
가엾은 내 사랑 빈집에 갇혔네`,
  }
];

// 한글 유니코드 범위 체크
const isKorean = (char: string) => {
  const code = char.charCodeAt(0);
  return code >= 0xAC00 && code <= 0xD7A3;
};

// 초성 검사
const isChoseong = (char: string) => {
  const code = char.charCodeAt(0);
  return code >= 0x3131 && code <= 0x314E;
};

// 중성 검사
const isJungseong = (char: string) => {
  const code = char.charCodeAt(0);
  return code >= 0x314F && code <= 0x3163;
};

const App: React.FC = () => {
  const currentPoem = poems[0];
  const poemLines = currentPoem.content.split('\n');
  
  // 각 줄별 상태 관리
  const [lineInputs, setLineInputs] = useState<string[]>(Array(poemLines.length).fill(''));
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [composingLine, setComposingLine] = useState<number | null>(null);
  // 선택된 폰트 상태 추가
  const [selectedFont, setSelectedFont] = useState(fontOptions[0].id);
  
  // 각 줄의 입력 필드에 대한 ref 생성
  const lineRefs = useRef<RefObject<HTMLInputElement>[]>(
    Array(poemLines.length).fill(null).map(() => createRef<HTMLInputElement>())
  );
  
  // 진행 상황 계산
  const calculateProgress = () => {
    let correctChars = 0;
    let totalChars = 0;
    
    poemLines.forEach((line, index) => {
      const input = lineInputs[index] || '';
      for (let i = 0; i < Math.min(line.length, input.length); i++) {
        if (line[i] === input[i]) {
          correctChars++;
        }
      }
      totalChars += line.length;
    });
    
    return (correctChars / totalChars) * 100;
  };
  
  // 줄 입력 처리
  const handleLineInput = (index: number, value: string) => {
    const newLineInputs = [...lineInputs];
    newLineInputs[index] = value;
    setLineInputs(newLineInputs);
    
    // 현재 줄이 완성되었는지 확인
    const currentLine = poemLines[index];
    if (value === currentLine && index < poemLines.length - 1) {
      // 다음 줄로 자동 이동 (약간의 지연 추가)
      setTimeout(() => {
        setActiveLineIndex(index + 1);
        lineRefs.current[index + 1].current?.focus();
      }, 100);
    }
    
    // 전체 완성 여부 확인
    checkCompletion(newLineInputs);
  };
  
  // 키 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // 엔터키 처리
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // 마지막 줄이 아니면 다음 줄로 이동
      if (index < poemLines.length - 1) {
        setActiveLineIndex(index + 1);
        lineRefs.current[index + 1].current?.focus();
      }
    }
    // 백스페이스 처리 - 현재 줄의 맨 앞에서 누르면 이전 줄로 이동
    else if (e.key === 'Backspace' && index > 0) {
      const cursorPosition = e.currentTarget.selectionStart;
      if (cursorPosition === 0) {
        e.preventDefault(); // 기본 백스페이스 동작 방지
        
        // 이전 줄로 이동
        const prevIndex = index - 1;
        setActiveLineIndex(prevIndex);
        
        // 이전 줄의 입력 필드에 포커스, 커서를 이전 줄의 텍스트 끝으로 이동
        setTimeout(() => {
          const prevInput = lineRefs.current[prevIndex].current;
          if (prevInput) {
            prevInput.focus();
            const prevText = lineInputs[prevIndex] || '';
            prevInput.selectionStart = prevText.length;
            prevInput.selectionEnd = prevText.length;
          }
        }, 0);
      }
    }
    // 위 화살표 처리
    else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      setActiveLineIndex(index - 1);
      lineRefs.current[index - 1].current?.focus();
    }
    // 아래 화살표 처리
    else if (e.key === 'ArrowDown' && index < poemLines.length - 1) {
      e.preventDefault();
      setActiveLineIndex(index + 1);
      lineRefs.current[index + 1].current?.focus();
    }
  };
  
  // 조합 이벤트 처리
  const handleCompositionStart = (index: number) => {
    setComposingLine(index);
  };
  
  const handleCompositionEnd = () => {
    setComposingLine(null);
  };
  
  // 완성 여부 확인
  const checkCompletion = (inputs: string[]) => {
    if (inputs.length !== poemLines.length) return false;
    
    const allComplete = poemLines.every((line, i) => line === inputs[i]);
    setCompleted(allComplete);
    return allComplete;
  };
  
  // 폰트 변경 핸들러
  const handleFontChange = (fontId: string) => {
    setSelectedFont(fontId);
  };
  
  // 줄 렌더링
  const renderLine = (line: string, index: number) => {
    const input = lineInputs[index] || '';
    const isActive = index === activeLineIndex;
    const isComposing = index === composingLine;
    
    // 각 글자 렌더링
    const chars = line.split('').map((char, i) => {
      // 입력된 글자가 있는 경우
      if (i < input.length) {
        // 조합 중이고 마지막 글자일 경우
        if (isComposing && i === input.length - 1) {
          return (
            <Char key={i} status="composing">
              {input[i]}
            </Char>
          );
        }
        
        // 일치 여부에 따라 스타일 결정
        const status = char === input[i] ? 'correct' : 'incorrect';
        return (
          <Char key={i} status={status}>
            {input[i]}
          </Char>
        );
      }
      
      // 입력되지 않은 글자는 기다림 상태
      return (
        <Char key={i} status="waiting">
          {char}
        </Char>
      );
    });
    
    return (
      <LineContainer key={index}>
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
        <OverlayLine fontFamily={selectedFont}>{chars}</OverlayLine>
      </LineContainer>
    );
  };
  
  // 초기 포커스 설정
  useEffect(() => {
    lineRefs.current[activeLineIndex].current?.focus();
  }, [activeLineIndex]);
  
  const progress = calculateProgress();
  
  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <Title>시로(詩路)</Title>
        
        {/* 폰트 선택 UI */}
        <FontSelectorContainer>
          {fontOptions.map(font => (
            <FontChip 
              key={font.id}
              isSelected={selectedFont === font.id}
              onClick={() => handleFontChange(font.id)}
              className={font.id}
            >
              {font.name}
            </FontChip>
          ))}
        </FontSelectorContainer>
        
        <ProgressBar>
          <Progress width={progress} />
        </ProgressBar>
        <TypingArea>
          <TextContainer fontFamily={selectedFont}>
            {poemLines.map((line, i) => renderLine(line, i))}
          </TextContainer>
        </TypingArea>
        <CompletionMessage show={completed}>
          <h2>🎉 축하합니다! 🎉</h2>
          <p>성공적으로 시를 완성하셨습니다!</p>
        </CompletionMessage>
      </AppContainer>
    </>
  );
};

export default App; 