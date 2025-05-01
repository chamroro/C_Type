import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where,
  setDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import CountUp from 'react-countup';

// 관리자 아이디 설정
const ADMIN_ID = process.env.REACT_APP_ADMIN_ID || '';
// 시 인터페이스
interface Poem {
  id?: string;
  title: string;
  content: string;
  author: string;
  completedUsers?: string[];
}

// 통계 인터페이스 추가
interface Statistics {
  totalCompletions: number;
  totalUsers: number;
  completedAllPoemsCount: number;
  maxCompletionsForPoem: number;
}

interface UserData {
  uid: string;
  nickname?: string;
  displayName?: string;
  completedPoems?: string[];
}

// 스타일 컴포넌트
const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
 
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #333;
  margin: 0;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 900;
  letter-spacing: -0.05em;
`;

const Button = styled.button`
  padding: 0.3rem 0.7rem;
  background-color:rgb(44, 71, 101);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 700;
  transition: background-color 0.2s;

  &:hover {
    background-color:rgb(108, 132, 157);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const DangerButton = styled(Button)`
  background-color:rgb(213, 136, 128);
  
  &:hover {
    background-color: #c0392b;
  }
`;

const Form = styled.form`
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 150px;
  resize: vertical;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  vertical-align: middle;
  color: rgb(65, 65, 65);
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.5rem 1rem;
  border-bottom: 2px solid #eee;


`;

const Td = styled.td`
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #eee;

  
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #fadbd8;
  border-radius: 4px;
`;

const SuccessMessage = styled.div`
  color: #27ae60;
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #d4efdf;
  border-radius: 4px;
`;

const NoAccessMessage = styled.div`
  text-align: center;
  margin-top: 5rem;
  color: #e74c3c;
  font-size: 1.2rem;
`;

// 통계 카드 스타일 컴포넌트
const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: white;
  padding: 1.5rem;
  
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: rgb(73, 92, 75);
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  letter-spacing: -0.05em;
`;

const AdminPoems: React.FC = () => {
  const { currentUser } = useAuth();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Statistics>({
    totalCompletions: 0,
    totalUsers: 0,
    completedAllPoemsCount: 0,
    maxCompletionsForPoem: 0
  });
  
  // 시 추가/편집을 위한 상태
  const [showForm, setShowForm] = useState(false);
  const [editingPoem, setEditingPoem] = useState<Poem | null>(null);
  const [formData, setFormData] = useState<Poem>({
    id: '',
    title: '',
    content: '',
    author: '',
    completedUsers: []
  });
  
  // 관리자 권한 확인
  const isAdmin = Boolean(currentUser?.uid && ADMIN_ID && currentUser.uid === ADMIN_ID);
  console.log('권한 확인:', {
    currentUid: currentUser?.uid,
    adminId: ADMIN_ID,
    isAdmin
  });
  
  // 통합된 데이터 가져오기 함수
  const fetchData = async () => {
    
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      setError(null);

      // 1. 시와 사용자 데이터를 병렬로 가져오기
      const [poemSnapshot, userSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'poems'), orderBy('title'))),
        getDocs(collection(db, 'users'))
      ]);

      // 2. 시 데이터 처리
      const poemsList = poemSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Poem
      }));
      setPoems(poemsList);

      // 3. 통계 계산
      const totalPoemsCount = poemsList.length;
      let totalCompletions = 0;
      let maxCompletions = 0;
      let completedAllPoemsCount = 0;

      // 시별 통계
      poemsList.forEach(poem => {
        const completionsCount = poem.completedUsers?.length || 0;
        totalCompletions += completionsCount;
        maxCompletions = Math.max(maxCompletions, completionsCount);
      });

      // 사용자별 통계 및 닉네임 캐시
      const newNicknames: {[key: string]: string} = {};
      userSnapshot.docs.forEach(userDoc => {
        const userData = userDoc.data() as UserData;
        newNicknames[userDoc.id] = userData.nickname || userData.displayName || '사용자';
        
        const completedPoemsCount = userData.completedPoems?.length || 0;
        if (completedPoemsCount === totalPoemsCount) {
          completedAllPoemsCount++;
        }
      });

      // 4. 상태 업데이트
      setStatistics({
        totalCompletions,
        totalUsers: userSnapshot.size,
        completedAllPoemsCount,
        maxCompletionsForPoem: maxCompletions
      });
      

    } catch (error) {
      console.error('데이터 가져오기 오류:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 초기 데이터 로딩
  useEffect(() => {
    fetchData();
  }, [isAdmin]);
  
  // 폼 입력 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // 시 추가 폼 초기화
  const initAddForm = () => {
    setFormData({
      id: '',
      title: '',
      content: '',
      author: '',
      completedUsers: []
    });
    setEditingPoem(null);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };
  
  // 시 편집 폼 초기화
  const initEditForm = (poem: Poem) => {
    setFormData({
      ...poem
    });
    setEditingPoem(poem);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };
  
  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingPoem && editingPoem.id) {
        // 시 수정
        await updateDoc(doc(db, 'poems', editingPoem.id), {
          title: formData.title,
          content: formData.content,
          author: formData.author
        });
        setSuccess('시가 성공적으로 수정되었습니다.');
      } else {
        // 현재 가장 큰 ID 값 찾기
        const poemsQuery = query(collection(db, 'poems'));
        const poemSnapshot = await getDocs(poemsQuery);
        let maxId = 0;
        
        poemSnapshot.docs.forEach(doc => {
          const numericId = parseInt(doc.id);
          if (!isNaN(numericId) && numericId > maxId) {
            maxId = numericId;
          }
        });

        // 새로운 ID 생성 (최대값 + 1)
        const newId = (maxId + 1).toString();

        // 새 시 추가
        await setDoc(doc(db, 'poems', newId), {
          title: formData.title,
          content: formData.content,
          author: formData.author,
          completedUsers: []
        });
        setSuccess('새로운 시가 성공적으로 추가되었습니다.');
      }

      // 폼 초기화
      setShowForm(false);
      setFormData({
        id: '',
        title: '',
        content: '',
        author: '',
        completedUsers: []
      });
      setEditingPoem(null);

      // 시 목록 새로고침
      fetchData();
    } catch (err) {
      console.error('Error:', err);
      setError('시를 저장하는 중 오류가 발생했습니다.');
    }
  };
  
  // 시 삭제 처리
  const handleDelete = async (poemId: string) => {
    if (!window.confirm('정말로 이 시를 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'poems', poemId));
      setSuccess('시가 성공적으로 삭제되었습니다.');
      fetchData();
    } catch (error) {
      console.error('시 삭제 오류:', error);
      setError('시를 삭제하는 중 오류가 발생했습니다.');
    }
  };
  
  
  if (!isAdmin) {
    return (
      <Container>
        <NoAccessMessage>
          <h2>접근 권한이 없습니다</h2>
          <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
        </NoAccessMessage>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <Title>HOME SWEET HOME</Title>
        <div>
          <Button onClick={initAddForm}>ADD</Button>
        </div>
      </Header>
      
      <StatsContainer>
        <StatCard>
          <StatNumber><CountUp end={statistics.totalCompletions} duration={1.5} separator="," /></StatNumber> 
          <StatLabel>Total Completions</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber><CountUp end={statistics.totalUsers} duration={1.5} separator="," /></StatNumber>
          <StatLabel>Users</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber><CountUp end={statistics.completedAllPoemsCount} duration={1.5} separator="," /></StatNumber>
          <StatLabel>Users Who Completed All Poems</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber><CountUp end={statistics.maxCompletionsForPoem} duration={1.5} separator="," /></StatNumber>
          <StatLabel>Top Completed Poem</StatLabel>
        </StatCard>
      </StatsContainer>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}
      
      {showForm && (
        <Form onSubmit={handleSubmit}>
          <h2>{editingPoem ? 'EDIT' : 'ADD'}</h2>
          
          <FormGroup>
            <Label htmlFor="title">제목</Label>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="author">작가</Label>
            <Input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
            />
          </FormGroup>
          
          <div>
            <Button type="submit">저장</Button>
            <Button 
              type="button" 
              onClick={() => setShowForm(false)} 
              style={{ marginLeft: '10px', backgroundColor: '#999' }}
            >
              취소
            </Button>
          </div>
        </Form>
      )}
      
      {loading ? (
        <p>시 목록을 불러오는 중...</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>제목</Th>
              <Th>작가</Th>
              <Th>완료한 사용자</Th>
              <Th>작업</Th>
            </tr>
          </thead>
          <tbody>
            {poems.length === 0 ? (
              <tr>
                <Td colSpan={6}>시 목록이 비어있습니다.</Td>
              </tr>
            ) : (
              poems.map(poem => (
                <tr key={poem.id}>
                  <Td>{poem.title}</Td>
                  <Td>{poem.author}</Td>
                 
                  <Td>
                    {poem.completedUsers?.length || 0}명
                
                  </Td>
                  <Td>
                    <Actions>
                      <Button onClick={() => initEditForm(poem)}>EDIT</Button>
                      <DangerButton onClick={() => poem.id && handleDelete(poem.id)}>DEL</DangerButton>
                    </Actions>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default AdminPoems; 