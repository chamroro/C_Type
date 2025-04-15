import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: #333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  padding: 0.8rem;
  margin-bottom: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: #f5f5f5;
  color: #666;
  
  &:hover:not(:disabled) {
    background-color: #e9e9e9;
  }
`;

const SaveButton = styled(Button)`
  background-color: #4a90e2;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #3a7bc8;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

interface NicknameModalProps {
  isOpen: boolean;
  initialNickname: string;
  onSave: (nickname: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const NicknameModal: React.FC<NicknameModalProps> = ({ 
  isOpen, 
  initialNickname, 
  onSave, 
  onClose,
  isLoading = false
}) => {
  const [nickname, setNickname] = useState(initialNickname);
  
  useEffect(() => {
    setNickname(initialNickname);
  }, [initialNickname, isOpen]);
  
  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      onSave(nickname.trim());
    }
  };
  
  return (
    <ModalOverlay>
      <ModalContainer>
        <Title>닉네임 설정</Title>
        <Form onSubmit={handleSubmit}>
          <Label htmlFor="nickname">닉네임</Label>
          <Input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="사용할 닉네임을 입력하세요"
            autoFocus
            maxLength={20}
            disabled={isLoading}
          />
          <ButtonGroup>
            <CancelButton 
              type="button" 
              onClick={onClose}
              disabled={isLoading}
            >
              취소
            </CancelButton>
            <SaveButton 
              type="submit" 
              disabled={!nickname.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </SaveButton>
          </ButtonGroup>
        </Form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default NicknameModal; 