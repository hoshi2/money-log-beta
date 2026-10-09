import { INITIAL_DATA, DATA_VERSION } from '../data/initial.js';

const ENV = (typeof import.meta !== 'undefined' && import.meta.env) || {};
export const IS_BETA = ENV.VITE_BETA === '1';

export const fmt = (n) =>
  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(n ?? 0);

// ---------- 日付 ----------
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const due = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due - today) / 86400000);
};
export const isThisMonth = (dateStr) => {
  if (!dateStr) return false;
  const now = new Date();
  return dateStr.slice(0, 7) === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
// 今日から n ヶ月後の日付（YYYY-MM-DD）
export const monthsAhead = (n) => {
  const d = new Date(); d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const fmtDate = (dateStr) => {
  if (!dateStr) return '期限なし';
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
};

// ---------- 分類 ----------
export const monthlyOf = (e) => (e.cycle === 'year' ? Math.round((e.amount || 0) / 12) : (e.amount || 0));
// 借金のグループ: 未払い（kind）→ それ以外は 期限あり / 期限なし / 毎月返済 を月額と期限から決める
export const debtGroup = (d) => (d.kind === 'unpaid' ? 'unpaid' : (d.monthly || 0) > 0 ? 'monthly' : d.dueDate ? 'due' : 'other');
export const DEBT_GROUPS = [
  { key: 'due', label: '期限つき', hint: '期限を入れた借金' },
  { key: 'other', label: '期限なし', hint: '月額も期限もない借金' },
  { key: 'monthly', label: '毎月返済', hint: '月額を入れた借金' },
  { key: 'unpaid', label: '未払い', hint: '請求の未払い' },
];
export const EXPENSE_KINDS = [
  { key: 'sub', label: 'サブスク' },
  { key: 'fixed', label: '固定費' },
];

// ---------- 集計 ----------
export const calcTotals = (data) => {
  const subsMonthly = data.expenses.filter(e => e.kind === 'sub').reduce((s, e) => s + monthlyOf(e), 0);
  const fixedMonthly = data.expenses.filter(e => e.kind !== 'sub').reduce((s, e) => s + monthlyOf(e), 0);
  const expensesMonthly = subsMonthly + fixedMonthly;
  const open = data.debts.filter(d => !d.done);
  const byGroup = { monthly: 0, due: 0, other: 0, unpaid: 0 };
  open.forEach(d => { byGroup[debtGroup(d)] += d.balance || 0; });
  const unpaidTotal = byGroup.unpaid;
  const debtTotal = byGroup.monthly + byGroup.due + byGroup.other;
  const monthlyPayment = open.filter(d => debtGroup(d) === 'monthly').reduce((s, d) => s + (d.monthly || 0), 0);
  const dueThisMonth = open.filter(d => debtGroup(d) === 'due' && isThisMonth(d.dueDate)).reduce((s, d) => s + (d.balance || 0), 0);
  const totalDebt = debtTotal + unpaidTotal;
  const regularMonthly = expensesMonthly + monthlyPayment;   // 毎月の支払い（サブスク＋固定費＋月返済）
  const thisMonthPay = regularMonthly + dueThisMonth;
  const monthsToPayoff = monthlyPayment > 0 ? Math.ceil(byGroup.monthly / monthlyPayment) : null;
  const overdue = open.filter(d => { const n = daysUntil(d.dueDate); return n !== null && n < 0; }).length;
  const upcoming = open.filter(d => debtGroup(d) === 'due').sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  return {
    subsMonthly, fixedMonthly, expensesMonthly,
    debtMonthlyGroup: byGroup.monthly, debtDueGroup: byGroup.due, debtOtherGroup: byGroup.other, debtTotal,
    monthlyPayment, dueThisMonth, unpaidTotal, totalDebt, regularMonthly, thisMonthPay, monthsToPayoff, overdue, upcoming,
  };
};

export const getPayoffDate = (months) => {
  if (!months) return '—';
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
};

// ---------- 並び替え（同じグループの中で1つ上／下と入れ替える） ----------
export const moveItem = (list, id, dir, groupOf = () => 'all') => {
  const i = list.findIndex(x => x.id === id);
  if (i < 0) return list;
  const g = groupOf(list[i]);
  let j = i + dir;
  while (j >= 0 && j < list.length && groupOf(list[j]) !== g) j += dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

// ---------- 旧データ（v2）からの変換 ----------
// 旧: assets / income / expenses / debt1 / debt2 / unpaid / incomingJuly / memo
// 新: expenses(kind,cycle) / debts(=debt1+debt2) / unpaid。資産・収入・7月入金は捨てる
const SUB_WORDS = /サブスク|chatgpt|claude|microsoft|netflix|youtube|spotify|apple|amazon|prime|icloud|google|adobe|notion|会費/i;
export const migrateV2 = (old) => ({
  version: DATA_VERSION,
  expenses: (old.expenses || []).map(e => ({
    id: e.id, name: e.name || '', amount: e.amount || 0,
    kind: SUB_WORDS.test(e.name || '') ? 'sub' : 'fixed', cycle: 'month', note: e.note || e.category || '',
  })),
  debts: [
    ...(old.debt1 || []).map(d => ({
      id: d.id, name: d.name || '', balance: d.balance || 0, monthly: d.monthly || 0, dueDate: '', kind: '', done: false, note: d.note || '',
    })),
    ...(old.debt2 || []).map(d => ({
      id: d.id, name: d.name || '', balance: d.amount || 0, monthly: 0, dueDate: d.dueDate || '', kind: '',
      done: !!(d.done || d.status === 'done'), note: d.source || '',
    })),
    ...(old.unpaid || []).map(unpaidToDebt),
  ],
});

// 未払い（旧 unpaid の形）→ 借金の「未払い」グループ
const unpaidToDebt = (u) => ({
  id: u.id, name: u.name || '', balance: u.amount || 0, monthly: 0, dueDate: u.dueDate || '', kind: 'unpaid',
  done: !!u.done, note: [u.category, u.note].filter(Boolean).join(' — '),
});

// 以前の形（debtMonthly / debtDue に分かれていた形、unpaid が別配列だった形）→ 現在の形
const mergeInterim = (s) => ({
  ...s,
  debts: [
    ...(s.debts || [
      ...(s.debtMonthly || []).map(d => ({ id: d.id, name: d.name, balance: d.balance || 0, monthly: d.monthly || 0, dueDate: '', kind: '', done: false, note: d.note || '' })),
      ...(s.debtDue || []).map(d => ({ id: d.id, name: d.name, balance: d.amount || 0, monthly: 0, dueDate: d.dueDate || '', kind: '', done: !!d.done, note: d.note || '' })),
    ]),
    ...(s.unpaid || []).map(unpaidToDebt),
  ],
});

// どんな形で来ても今の形にそろえる（欠けた項目は空にする）
export const ensureV3 = (state) => {
  if (!state || typeof state !== 'object') return null;
  if (state.version !== DATA_VERSION) return migrateV2(state);
  const s = mergeInterim(state);
  return {
    version: DATA_VERSION,
    expenses: (s.expenses || []).map(e => ({ kind: 'fixed', cycle: 'month', note: '', ...e })),
    debts: (s.debts || []).map(d => ({ monthly: 0, dueDate: '', kind: '', done: false, note: '', ...d })),
  };
};

// ---------- 保存 ----------
export const STORAGE_KEY = IS_BETA ? 'stella_v3_beta' : 'stella_v3';
export const LEGACY_KEY = 'stella_v2';

const readJson = (key) => {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
};
export const save = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
};
export const load = () => ensureV3(readJson(STORAGE_KEY));
// 旧データ（本番の v2 / v3）を読むだけ。書き換えない
export const loadLegacy = () => readJson(LEGACY_KEY);
export const loadProductionV3 = () => readJson('stella_v3');
