import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import 'dotenv/config';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface CompletedUser {
  id: string;
  comment: string;
}

interface PoemDoc {
  id: string;
  completedUsers?: CompletedUser[];
}

interface UserDoc {
  id: string;
  nickname?: string;
  displayName?: string;
  email?: string;
  completedPoems?: string[];
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 이메일 마스킹 함수
function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return '';
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 3);
  const masked = '*'.repeat(Math.max(local.length - 3, 0));
  return `${visible}${masked}@${domain}`;
}

async function drawEventWinners() {
  const poemsSnapshot = await getDocs(collection(db, 'poems'));
  const poems: PoemDoc[] = poemsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      completedUsers: data.completedUsers || [],
    };
  });

  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users: UserDoc[] = usersSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      nickname: data.nickname,
      displayName: data.displayName,
      email: data.email,
      completedPoems: data.completedPoems || [],
    };
  });

  const totalPoemCount = poems.length;
  const allCompletedUsers = users.filter(user => {
    const completedPoems = user.completedPoems || [];
    return completedPoems.length === totalPoemCount;
  });

  const firstCommenters = new Set<string>();
  for (const poem of poems) {
    if (poem.completedUsers && poem.completedUsers.length > 0) {
      const firstUser = poem.completedUsers[0].id;
      firstCommenters.add(firstUser);
    }
  }
  const firstCommenterUsers = users.filter(user => firstCommenters.has(user.id));

  function pickRandom<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const allCompletedWinner = pickRandom(allCompletedUsers);
  const firstCommentWinner = pickRandom(firstCommenterUsers);

  console.log('--- 모든 시를 타이핑한 사람 중 당첨자 ---');
  process.stdout.write('행운의 주인공은?');
  for (let i = 0; i < 6; i++) {
    await sleep(333);
    process.stdout.write('🍀');
  }
  console.log();
  if (allCompletedWinner) {
    console.log(`닉네임: ${allCompletedWinner.nickname || allCompletedWinner.displayName || allCompletedWinner.id}`);
    console.log(`이메일: ${maskEmail(allCompletedWinner.email)}`);
  }

  console.log('\n--- 20개의 시의 첫 댓글을 단 사람 중 당첨자 ---');
  process.stdout.write('두구두구');
  for (let i = 0; i < 6; i++) {
    await sleep(555);
    process.stdout.write('🥁');
  }
  console.log();
  if (firstCommentWinner) {
    console.log(`닉네임: ${firstCommentWinner.nickname || firstCommentWinner.displayName || firstCommentWinner.id}`);
    console.log(`이메일: ${maskEmail(firstCommentWinner.email)}`);
  }
}

drawEventWinners().then(() => {
  console.log('축하합니다! 🎁');
  process.exit(0);
});
