import React from 'react';
import styled from 'styled-components';

const WarningContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: rgb(73, 92, 75);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 2rem;
  text-align: center;
  font-family: 'Pretendard-Regular';
  @media (max-width: 768px) {
    display: flex;
  }
`;

const WarningText = styled.p`
  color: white;
  font-size: 0.8rem;
  line-height: 1.6;
  margin: 0;
`;

const MobileWarning = () => {
  return (
    <WarningContainer>
      <WarningText>
        ⚠️ <br></br>
        詩路는 최적의 타이핑 경험을 위해 <br></br>
        모바일 버전은 제공하지 않고 있어요. 🥲<br></br>
        PC 버전에서 이용해주세요.
      </WarningText>
    </WarningContainer>
  );
};

export default MobileWarning;
