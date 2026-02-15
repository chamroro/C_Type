import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import CountUp from 'react-countup';

// 관리자 아이디 설정
const ADMIN_ID = process.env.REACT_APP_ADMIN_ID || '';
// 시 인터페이스
interface CompletedUserObject {
  id: string;
  comment?: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

type CompletedUserEntry = string | CompletedUserObject;

interface Poem {
  id?: string;
  title: string;
  content: string;
  author: string;
  completedUsers?: CompletedUserEntry[];
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
  email?: string;
  completedPoems?: string[];
}

interface CompletedAllUserInfo {
  uid: string;
  nickname: string;
  email: string;
  completedPoemsCount: number;
}

interface CommentRow {
  id: string;
  poemId: string;
  poemTitle: string;
  uid: string;
  nickname: string;
  comment: string;
  createdAtMs: number | null;
  fallbackOrder: number;
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
  font-family: "Noto Sans KR", sans-serif;
  font-weight: 900;
  letter-spacing: -0.05em;
`;

const Button = styled.button`
  padding: 0.3rem 0.7rem;
  background-color: rgb(44, 71, 101);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 700;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgb(108, 132, 157);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const DangerButton = styled(Button)`
  background-color: rgb(213, 136, 128);

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
  font-family: "Noto Sans KR", sans-serif;
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
  font-family: "Noto Sans KR", sans-serif;
  font-weight: 700;
  letter-spacing: -0.05em;
`;

const SectionTitle = styled.h2`
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  color: #333;
`;

const SectionDescription = styled.p`
  margin: 0 0 0.5rem;
  color: #666;
  font-size: 0.85rem;
`;

const PaginationBar = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const PaginationButton = styled(Button)`
  font-size: 0.75rem;
`;

const PaginationInfo = styled.span`
  color: #666;
  font-size: 0.8rem;
`;

const getTimestampMs = (value?: { seconds: number; nanoseconds: number } | null): number | null => {
  if (!value || typeof value.seconds !== 'number') return null;
  return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1000000);
};

const getCommentDedupKey = (poemId: string, uid: string, comment: string) =>
  `${poemId}::${uid}::${comment}`;

const AdminPoems: React.FC = () => {
  const COMMENTS_PER_PAGE = 10;
  const { currentUser } = useAuth();
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [completedAllUsers, setCompletedAllUsers] = useState<CompletedAllUserInfo[]>([]);
  const [commentRows, setCommentRows] = useState<CommentRow[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [statistics, setStatistics] = useState<Statistics>({
    totalCompletions: 0,
    totalUsers: 0,
    completedAllPoemsCount: 0,
    maxCompletionsForPoem: 0,
  });

  // 시 추가/편집을 위한 상태
  const [showForm, setShowForm] = useState(false);
  const [editingPoem, setEditingPoem] = useState<Poem | null>(null);
  const [formData, setFormData] = useState<Poem>({
    id: '',
    title: '',
    content: '',
    author: '',
    completedUsers: [],
  });

  // 관리자 권한 확인
  const isAdmin = Boolean(currentUser?.uid && ADMIN_ID && currentUser.uid === ADMIN_ID);
  console.log('권한 확인:', {
    currentUid: currentUser?.uid,
    adminId: ADMIN_ID,
    isAdmin,
  });

  // 통합된 데이터 가져오기 함수
  const fetchData = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      // 1. 시와 사용자 데이터를 병렬로 가져오기
      const [poemSnapshot, userSnapshot, commentSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'poems'), orderBy('title'))),
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'comments'), orderBy('createdAt', 'desc'))).catch((err) => {
          console.warn('comments 조회 실패, legacy 댓글만 사용합니다:', err);
          return null;
        }),
      ]);

      // 2. 시 데이터 처리
      const poemsList = poemSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Poem),
      }));
      setPoems(poemsList);

      // 3. 통계 계산
      const totalPoemsCount = poemsList.length;
      let totalCompletions = 0;
      let maxCompletions = 0;
      let completedAllPoemsCount = 0;
      let fallbackOrder = 0;

      // 시별 통계
      poemsList.forEach((poem) => {
        const completionsCount = poem.completedUsers?.length || 0;
        totalCompletions += completionsCount;
        maxCompletions = Math.max(maxCompletions, completionsCount);
      });

      // 사용자 캐시 및 완주 유저 데이터
      const userMap: { [key: string]: UserData } = {};
      const completedAllUsersList: CompletedAllUserInfo[] = [];
      userSnapshot.docs.forEach((userDoc) => {
        const userData = { ...(userDoc.data() as UserData), uid: userDoc.id };
        userMap[userDoc.id] = userData;

        const completedPoemsCount = userData.completedPoems?.length || 0;
        if (totalPoemsCount > 0 && completedPoemsCount === totalPoemsCount) {
          completedAllPoemsCount++;
          completedAllUsersList.push({
            uid: userDoc.id,
            nickname: userData.nickname || userData.displayName || '사용자',
            email: userData.email || '-',
            completedPoemsCount,
          });
        }
      });

      completedAllUsersList.sort((a, b) => a.nickname.localeCompare(b.nickname, 'ko'));

      // 댓글 전체(시 구분 없이) 최신순 데이터
      const poemTitleMap = poemsList.reduce(
        (acc, poem) => {
          if (poem.id) acc[poem.id] = poem.title;
          return acc;
        },
        {} as Record<string, string>,
      );

      const timedCommentRows: CommentRow[] = (commentSnapshot?.docs || []).map((commentDoc, index) => {
        const data = commentDoc.data() as {
          uid?: string;
          poemId?: string;
          comment?: string;
          createdAt?: { seconds: number; nanoseconds: number } | null;
        };
        const poemId = data.poemId || '-';
        const uid = data.uid || '-';
        const comment = (data.comment || '').trim();

        return {
          id: commentDoc.id,
          poemId,
          poemTitle: poemTitleMap[poemId] || '-',
          uid,
          nickname: userMap[uid]?.nickname || userMap[uid]?.displayName || uid || '사용자',
          comment,
          createdAtMs: getTimestampMs(data.createdAt),
          fallbackOrder: index + 1,
        };
      });

      // 신규 comments 컬렉션에 이미 있는 항목은 legacy fallback에서 중복 제거
      const timedKeyCountMap: Record<string, number> = {};
      timedCommentRows.forEach((row) => {
        const key = getCommentDedupKey(row.poemId, row.uid, row.comment);
        timedKeyCountMap[key] = (timedKeyCountMap[key] || 0) + 1;
      });

      const legacyCommentRows: CommentRow[] = [];
      poemsList.forEach((poem) => {
        (poem.completedUsers || []).forEach((entry) => {
          const normalizedEntry =
            typeof entry === 'string' ? { id: entry, comment: '', createdAt: null } : entry;
          const comment = (normalizedEntry.comment || '').trim();
          if (!comment) return;

          const dedupKey = getCommentDedupKey(poem.id || '-', normalizedEntry.id, comment);
          if ((timedKeyCountMap[dedupKey] || 0) > 0) {
            timedKeyCountMap[dedupKey] -= 1;
            return;
          }

          fallbackOrder += 1;
          legacyCommentRows.push({
            id: `${poem.id}-${normalizedEntry.id}-${fallbackOrder}`,
            poemId: poem.id || '-',
            poemTitle: poem.title || '-',
            uid: normalizedEntry.id,
            nickname:
              userMap[normalizedEntry.id]?.nickname ||
              userMap[normalizedEntry.id]?.displayName ||
              normalizedEntry.id ||
              '사용자',
            comment,
            createdAtMs: getTimestampMs(normalizedEntry.createdAt),
            fallbackOrder,
          });
        });
      });

      const allCommentRows = [...timedCommentRows, ...legacyCommentRows];
      allCommentRows.sort((a, b) => {
        const aMs = a.createdAtMs ?? -1;
        const bMs = b.createdAtMs ?? -1;
        if (aMs !== bMs) return bMs - aMs;
        const byNickname = a.nickname.localeCompare(b.nickname, 'ko');
        if (byNickname !== 0) return byNickname;
        const byComment = a.comment.localeCompare(b.comment, 'ko');
        if (byComment !== 0) return byComment;
        return b.fallbackOrder - a.fallbackOrder;
      });

      // 4. 상태 업데이트
      setStatistics({
        totalCompletions,
        totalUsers: userSnapshot.size,
        completedAllPoemsCount,
        maxCompletionsForPoem: maxCompletions,
      });
      setCompletedAllUsers(completedAllUsersList);
      setCommentRows(allCommentRows);
      setCommentPage(1);
    } catch (error) {
      console.error('데이터 가져오기 오류:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const totalCommentPages = Math.max(1, Math.ceil(commentRows.length / COMMENTS_PER_PAGE));
  const currentCommentRows = commentRows.slice(
    (commentPage - 1) * COMMENTS_PER_PAGE,
    commentPage * COMMENTS_PER_PAGE,
  );
  const formatCommentDate = (ms: number | null) => {
    if (ms === null) return '시간 미기록';
    return new Date(ms).toLocaleString('ko-KR');
  };

  // 초기 데이터 로딩
  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  // 폼 입력 변경 처리
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 시 추가 폼 초기화
  const initAddForm = () => {
    setFormData({
      id: '',
      title: '',
      content: '',
      author: '',
      completedUsers: [],
    });
    setEditingPoem(null);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  // 시 편집 폼 초기화
  const initEditForm = (poem: Poem) => {
    setFormData({
      ...poem,
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
          author: formData.author,
        });
        setSuccess('시가 성공적으로 수정되었습니다.');
      } else {
        // 현재 가장 큰 ID 값 찾기
        const poemsQuery = query(collection(db, 'poems'));
        const poemSnapshot = await getDocs(poemsQuery);
        let maxId = 0;

        poemSnapshot.docs.forEach((doc) => {
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
          completedUsers: [],
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
        completedUsers: [],
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
          <StatNumber>
            <CountUp end={statistics.totalCompletions} duration={1.5} separator="," />
          </StatNumber>
          <StatLabel>Total Completions</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>
            <CountUp end={statistics.totalUsers} duration={1.5} separator="," />
          </StatNumber>
          <StatLabel>Users</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>
            <CountUp end={statistics.completedAllPoemsCount} duration={1.5} separator="," />
          </StatNumber>
          <StatLabel>Users Who Completed All Poems</StatLabel>
        </StatCard>
        <StatCard>
          <StatNumber>
            <CountUp end={statistics.maxCompletionsForPoem} duration={1.5} separator="," />
          </StatNumber>
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

      <SectionTitle>Users Who Completed All Poems</SectionTitle>
      <SectionDescription>전체 시를 모두 완료한 유저의 정보입니다.</SectionDescription>
      <Table>
        <thead>
          <tr>
            <Th>닉네임</Th>
            <Th>이메일</Th>
            <Th>완료한 시 수</Th>
            <Th>UID</Th>
          </tr>
        </thead>
        <tbody>
          {completedAllUsers.length === 0 ? (
            <tr>
              <Td colSpan={4}>전체 시를 완료한 사용자가 없습니다.</Td>
            </tr>
          ) : (
            completedAllUsers.map((user) => (
              <tr key={user.uid}>
                <Td>{user.nickname}</Td>
                <Td>{user.email}</Td>
                <Td>{user.completedPoemsCount}</Td>
                <Td>{user.uid}</Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <SectionTitle>Latest Comments (All Poems)</SectionTitle>
      <SectionDescription>
        시 구분 없이 달린 댓글을 최신순으로 확인할 수 있습니다.
      </SectionDescription>
      <Table>
        <thead>
          <tr>
            <Th>작성 시각</Th>
            <Th>닉네임</Th>
            <Th>시 제목</Th>
            <Th>댓글</Th>
          </tr>
        </thead>
        <tbody>
          {commentRows.length === 0 ? (
            <tr>
              <Td colSpan={4}>등록된 댓글이 없습니다.</Td>
            </tr>
          ) : (
            currentCommentRows.map((comment) => (
              <tr key={comment.id}>
                <Td>{formatCommentDate(comment.createdAtMs)}</Td>
                <Td>{comment.nickname}</Td>
                <Td>{comment.poemTitle}</Td>
                <Td>{comment.comment}</Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      {commentRows.length > 0 && (
        <PaginationBar>
          <PaginationButton
            type="button"
            onClick={() => setCommentPage((prev) => Math.max(1, prev - 1))}
            disabled={commentPage === 1}
          >
            PREV
          </PaginationButton>
          <PaginationInfo>
            {commentPage} / {totalCommentPages}
          </PaginationInfo>
          <PaginationButton
            type="button"
            onClick={() => setCommentPage((prev) => Math.min(totalCommentPages, prev + 1))}
            disabled={commentPage === totalCommentPages}
          >
            NEXT
          </PaginationButton>
        </PaginationBar>
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
              poems.map((poem) => (
                <tr key={poem.id}>
                  <Td>{poem.title}</Td>
                  <Td>{poem.author}</Td>

                  <Td>{poem.completedUsers?.length || 0}명</Td>
                  <Td>
                    <Actions>
                      <Button onClick={() => initEditForm(poem)}>EDIT</Button>
                      <DangerButton onClick={() => poem.id && handleDelete(poem.id)}>
                        DEL
                      </DangerButton>
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
