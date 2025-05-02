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
        <PopupTitle>시 타이핑하고, 조그만 선물 받아가세요 :) 🎁</PopupTitle>
        <PopupDescription>
        타자를 통해 시를 완성해보는 작은 공간, <br />
        詩路(시로:시를 따라 걷는 길)에서는 <br />
        마음을 담아 시를 적어주신 분들께 <b>조그마한 선물</b>을 준비했어요. <br />
        <br />
        총 20편의 시가 준비되어 있고, <br />
        1️⃣ 각 시의 <b>첫 번째 타이퍼</b> 중 한 분을,  2️⃣ <b>모든 시를 완성한 타이퍼</b> 중 한 분을 <br />
추첨하여 감사의 마음을 전하려 합니다. <br />
<br />
이벤트 기간: 4월 18일(목) ~ 5월 3일(토) <br />
당첨자 발표: 5월 4일 (haeunkim.on 인스타그램 스토리 및 가입 이메일 개별 안내)
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