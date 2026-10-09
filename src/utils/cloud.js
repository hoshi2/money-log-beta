// ========================================================
// クラウド自動保存（Firebase Firestore）
//   ・設定タブで Firebase設定 を貼り付け＋同期コードを決めると有効
//   ・入力するたびに /stella/{同期コード}-v3 に自動保存
//   ・別の端末で同じコードを入れると同じデータを読み込む
//   ・旧版（v2）の保存先 /stella/{同期コード} は読むだけで書き換えない
// ========================================================
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const CKEY = 'stella-cloud';
const DOC_SUFFIX = '-v3';

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

const ref = (code) => doc(db, 'stella', code + DOC_SUFFIX);
const legacyRef = (code) => doc(db, 'stella', code);

async function readDoc(r) {
  const snap = await getDoc(r);
  if (!snap.exists()) return null;
  const d = snap.data();
  if (!d || !d.data) return null;
  try { return { state: JSON.parse(d.data), updatedAt: d.updatedAt || 0 }; }
  catch { return null; }
}
export const cloudPull = (code) => readDoc(ref(code));
export const cloudPullLegacy = (code) => readDoc(legacyRef(code));

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
