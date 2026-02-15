import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(137, 137, 137, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const PopupContent = styled.div`
  background-color: rgba(255, 255, 255, 0.8);
  border: 2px solid white;
  padding: 2rem;
  border-radius: 15px;
  max-width: 500px;
  width: 90%;
  position: relative;
  font-family: 'Pretendard-Regular';
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const PopupTitle = styled.h2`
  color: rgb(73, 92, 75);
  margin-top: 0;
  font-size: 1.2rem;
  margin-bottom: 1rem;
`;

const PopupDescription = styled.p`
  color: #333;
  font-size: 0.8rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  font-family: 'Arial';
  font-weight: 500;
  letter-spacing: -0.03em;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ primary?: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-family: 'Pretendard-Regular';
  background-color: ${props => props.primary ? 'rgb(73, 92, 75)' : '#f0f0f0'};
  color: ${props => props.primary ? 'white' : '#333'};
  
  &:hover {
    opacity: 0.9;
  }
`;

const DailyPopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const shouldShowPopup = () => {
      const lastShown = localStorage.getItem('lastPopupShown');
      if (!lastShown) return true;

      const today = new Date().toDateString();
      return lastShown !== today;
    };

    if (shouldShowPopup()) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleDontShowToday = () => {
    const today = new Date().toDateString();
    localStorage.setItem('lastPopupShown', today);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <PopupOverlay>
      <PopupContent>
        <PopupTitle>시로 이벤트에 참여해주셔서 감사합니다. </PopupTitle>
        <PopupDescription>
        지난 이벤트 결과가 발표되었습니다. <br/>
        <a href="https://www.instagram.com/reel/DJOQuPJJZ-M/?igsh=MXc2eG9nc2t3cjIyMQ%3D%3D" target="_blank" rel="noopener noreferrer">instagram 링크 </a>
        이곳에서 추첨 결과를 확인할 수 있습니다. <br />
        감사합니다. 
        </PopupDescription>
        <ButtonContainer>
          <Button onClick={handleDontShowToday}>오늘 하루 보지 않기</Button>
          <Button primary onClick={handleClose}>확인</Button>
        </ButtonContainer>
      </PopupContent>
    </PopupOverlay>
  );
};

export default DailyPopup; 