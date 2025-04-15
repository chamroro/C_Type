import { useState, FormEvent } from "react";
import styled from "styled-components";
import { useAuth } from "../../contexts/AuthContext";

const LoginContainer = styled.div`
  max-width: 420px;
  margin: 3rem auto;
  padding: 3rem;
  background-color: #fff;
  font-family: 'YESMyoungjo-Regular', serif;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 2.5rem;
  color: #212121;
  font-size: 1.6rem;
  font-weight: 500;
  letter-spacing: -0.02em;
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #757575;
  letter-spacing: 0.02em;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem 0;
  border: none;
  border-bottom: 1px solid #e0e0e0;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
  
  &:focus {
    border-color: #212121;
  }
`;

const Button = styled.button`
  padding: 0.9rem;
  background-color: #212121;
  color: white;
  border: none;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
  letter-spacing: 0.02em;
  margin-top: 1rem;

  &:hover {
    background-color: #333;
  }

  &:disabled {
    background-color: #e0e0e0;
    color: #9e9e9e;
    cursor: not-allowed;
  }
`;

const GoogleButton = styled(Button)`
  background-color: transparent;
  color: #212121;
  border: 1px solid #e0e0e0;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    background-color: #f9f9f9;
    border-color: #bdbdbd;
  }
`;

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const ErrorMessage = styled.p`
  color: #d32f2f;
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
`;

const SwitchLink = styled.p`
  text-align: center;
  margin-top: 2rem;
  font-size: 0.9rem;
  color: #757575;

  a {
    color: #212121;
    text-decoration: none;
    margin-left: 0.5rem;
    position: relative;
    
    &:after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 1px;
      background-color: #212121;
      transition: width 0.3s;
    }

    &:hover:after {
      width: 100%;
    }
  }
`;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, error, clearError } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      clearError();
      await login(email, password);
      // 로그인 성공 시 홈으로 리다이렉트 (라우터 설정 후)
    } catch (error) {
      console.error("로그인 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    try {
      clearError();
      await loginWithGoogle();
      // 로그인 성공 시 홈으로 리다이렉트 (라우터 설정 후)
    } catch (error) {
      console.error("구글 로그인 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <Title>로그인</Title>
      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </InputGroup>
        <Button type="submit" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </Button>
      </Form>
      
      <GoogleButton type="button" onClick={handleGoogleLogin} disabled={loading}>
        <GoogleIcon />
        구글 계정으로 로그인
      </GoogleButton>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <SwitchLink>
        계정이 없으신가요?<a href="/signup">회원가입</a>
      </SwitchLink>
    </LoginContainer>
  );
};

export default Login; 