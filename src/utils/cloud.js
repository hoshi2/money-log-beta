// ========================================================
// クラウド自動保存（Firebase Firestore）
//   ・設定タブで Firebase設定 を貼り付け＋同期コードを決めると有効
//   ・入力するたびに /stella/{同期コード} に自動保存
//   ・別の端末で同じコードを入れると同じデータを読み込む
// ========================================================
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const CKEY = 'stella-cloud';

export function loadCloud() {
  try { return JSON.parse(localStorage.getItem(CKEY)) || null; } catch { return null; }
}
export function saveCloud(v) { localStorage.setItem(CKEY, JSON.stringify(v)); }
export function clearCloud() { localStorage.removeItem(CKEY); }

// Firebase設定（JSON でも `const firebaseConfig = {...}` でもOK）から {...} を取り出す
export function parseConfig(text) {
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) throw new Error('設定が見つかりません');
  // eslint-disable-next-line no-new-func
  const obj = Function('return (' + m[0] + ')')();
  if (!obj || !obj.projectId) throw new Error('projectId がありません');
  return obj;
}

let db = null;
export function connectCloud(config) {
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  db = getFirestore(app);
}

function ref(code) { return doc(db, 'stella', code); }

export async function cloudPull(code) {
  const snap = await getDoc(ref(code));
  if (!snap.exists()) return null;
  const d = snap.data();
  if (!d || !d.data) return null;
  try { return { state: JSON.parse(d.data), updatedAt: d.updatedAt || 0 }; }
  catch { return null; }
}

export async function cloudPush(code, state) {
  const updatedAt = Date.now();
  await setDoc(ref(code), { data: JSON.stringify(state), updatedAt });
  return updatedAt;
}

let unsub = null;
export function cloudSubscribe(code, cb) {
  if (unsub) { unsub(); unsub = null; }
  unsub = onSnapshot(ref(code), snap => {
    if (!snap.exists()) return;
    const d = snap.data();
    if (!d || !d.data) return;
    try { cb({ state: JSON.parse(d.data), updatedAt: d.updatedAt || 0 }); } catch { /* ignore */ }
  }, err => console.error('cloud subscribe error', err));
  return unsub;
}
