// Firebase 앱 설정 및 초기화
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// 파이어베이스 설정
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Firebase 초기화
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Firestore 초기화
export const db = firebase.firestore();

// Authentication 초기화
export const auth = firebase.auth();

// iframe을 숨기고 쿠키 기반 세션 지속성 설정
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    console.error('인증 지속성 설정 오류:', error);
  });

// iframe 화면에서 숨기기 설정
// @ts-ignore
auth.settings.appVerificationDisabledForTesting = true;

// Firestore 오프라인 지속성은 최신 SDK에서 기본적으로 활성화됨
// 필요한 경우 Firestore 설정을 여기에 추가

// 모듈 내보내기
export default firebase; 