import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, query } from 'firebase/firestore';

/**
 * poems:export
 * - Firestore poems 컬렉션을 읽어 public/poems.json으로 내보냅니다.
 * - 용도: 현재 DB 상태를 JSON 파일 기반으로 관리/수정하기 위한 기준 파일 생성.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const toSortKey = (id) => {
  const n = Number(id);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
};

async function main() {
  const poemSnapshot = await getDocs(query(collection(db, 'poems')));
  const poems = poemSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: String(doc.id),
        title: data.title ?? '',
        author: data.author ?? '',
        content: data.content ?? '',
      };
    })
    .sort((a, b) => {
      const ak = toSortKey(a.id);
      const bk = toSortKey(b.id);
      if (ak !== bk) return ak - bk;
      return a.id.localeCompare(b.id);
    });

  const outDir = path.resolve(__dirname, '..', 'public');
  const outPath = path.join(outDir, 'poems.json');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(poems, null, 2)}\n`, 'utf8');

  console.log(`Exported ${poems.length} poems -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
