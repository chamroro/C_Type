import { Timestamp } from 'firebase/firestore';

// 사용자 관련 타입 정의
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

// 시 관련 타입 정의
export interface Poem {
  id: number;
  title: string;
  content: string;
  author: string;
}
