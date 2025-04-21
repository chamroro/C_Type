import React from 'react';
import styled, { keyframes } from 'styled-components';

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const BubbleContainer = styled.div`
  position: fixed;
  right: 20px;
  bottom: 100px;
  animation: ${bounce} 2s ease-in-out infinite;
  z-index: 998;
`;

const Bubble = styled.div`
  background-color: rgb(73, 92, 75);
  color: white;
  padding: 12px 20px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-family: 'Pretendard-Regular';
  white-space: nowrap;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    right: 110px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid rgb(73, 92, 75);
  }
`;

const LoginBubble = () => {
  return (
    <BubbleContainer>
      <Bubble>
        로그인하면 감상평을 남길 수 있어요!
      </Bubble>
    </BubbleContainer>
  );
};

export default LoginBubble; 