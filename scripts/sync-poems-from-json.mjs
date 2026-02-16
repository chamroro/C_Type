import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * poems:sync
 * - public/poems.json 내용을 Firestore poems 컬렉션에 동기화합니다.
 * - 동작: id 기준 upsert(기존 문서 update, 없으면 create).
 * - 주의: JSON에 없는 기존 DB 문서는 삭제하지 않습니다.
 * - 권한: Firebase Admin SDK(서비스 계정)로 실행됩니다.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function initAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return initializeApp({ credential: cert(serviceAccount) });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp();
  }

  throw new Error(
    'Missing admin credentials. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json (recommended) or FIREBASE_SERVICE_ACCOUNT_JSON.',
  );
}

const app = initAdminApp();
const db = getFirestore(app);

async function main() {
  const jsonPath = path.resolve(__dirname, '..', 'public', 'poems.json');
  const poems = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  let created = 0;
  let updated = 0;

  for (const poem of poems) {
    const poemId = String(poem.id);
    const payload = {
      title: poem.title ?? '',
      author: poem.author ?? '',
      content: poem.content ?? '',
    };

    const ref = db.collection('poems').doc(poemId);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.update(payload);
      updated += 1;
    } else {
      await ref.set({ ...payload, completedUsers: [] });
      created += 1;
    }
  }

  console.log(
    `Synced poems from JSON. created=${created}, updated=${updated}, total=${poems.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
