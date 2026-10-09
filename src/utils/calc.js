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
export const fmtDate = (dateStr) => {
  if (!dateStr) return '期限なし';
  const [y, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
};

// ---------- 集計 ----------
export const monthlyOf = (e) => (e.cycle === 'year' ? Math.round((e.amount || 0) / 12) : (e.amount || 0));

export const calcTotals = (data) => {
  const expensesMonthly = data.expenses.reduce((s, e) => s + monthlyOf(e), 0);
  const debtMonthlyTotal = data.debtMonthly.reduce((s, d) => s + (d.balance || 0), 0);
  const debtMonthlyPayment = data.debtMonthly.reduce((s, d) => s + (d.monthly || 0), 0);
  const dueOpen = data.debtDue.filter(d => !d.done);
  const debtDueTotal = dueOpen.reduce((s, d) => s + (d.amount || 0), 0);
  const debtDueAll = data.debtDue.reduce((s, d) => s + (d.amount || 0), 0);
  const dueThisMonth = dueOpen.filter(d => isThisMonth(d.dueDate)).reduce((s, d) => s + (d.amount || 0), 0);
  const unpaidTotal = data.unpaid.reduce((s, u) => s + (u.amount || 0), 0);
  const totalDebt = debtMonthlyTotal + debtDueTotal + unpaidTotal;
  const thisMonthPay = expensesMonthly + debtMonthlyPayment + dueThisMonth;
  const monthsToPayoff = debtMonthlyPayment > 0 ? Math.ceil(debtMonthlyTotal / debtMonthlyPayment) : null;
  const paidRate = debtDueAll > 0 ? ((debtDueAll - debtDueTotal) / debtDueAll * 100) : 0;
  const upcoming = [...dueOpen].sort((a, b) => (a.dueDate || '9999') < (b.dueDate || '9999') ? -1 : 1);
  return {
    expensesMonthly, debtMonthlyTotal, debtMonthlyPayment, debtDueTotal, debtDueAll,
    dueThisMonth, unpaidTotal, totalDebt, thisMonthPay, monthsToPayoff, paidRate, upcoming,
  };
};

export const getPayoffDate = (months) => {
  if (!months) return '—';
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
};

// ---------- 旧データ（v2）からの変換 ----------
// 旧: assets / income / expenses / debt1 / debt2 / unpaid / incomingJuly / memo
// 新: expenses(cycle付き) / debtMonthly(=debt1) / debtDue(=debt2) / unpaid。資産・収入・7月入金は捨てる
export const migrateV2 = (old) => ({
  version: DATA_VERSION,
  expenses: (old.expenses || []).map(e => ({
    id: e.id, name: e.name || '', amount: e.amount || 0, cycle: 'month', note: e.note || e.category || '',
  })),
  debtMonthly: (old.debt1 || []).map(d => ({
    id: d.id, name: d.name || '', balance: d.balance || 0, monthly: d.monthly || 0, note: d.note || '',
  })),
  debtDue: (old.debt2 || []).map(d => ({
    id: d.id, name: d.name || '', amount: d.amount || 0, dueDate: d.dueDate || '',
    done: !!(d.done || d.status === 'done'), note: d.source || '',
  })),
  unpaid: (old.unpaid || []).map(u => ({
    id: u.id, name: u.name || '', amount: u.amount || 0, category: u.category || 'その他', note: u.note || '',
  })),
});

// どんな形で来ても v3 の形にそろえる（欠けた項目は空にする）
export const ensureV3 = (state) => {
  if (!state || typeof state !== 'object') return null;
  if (state.version !== DATA_VERSION) return migrateV2(state);
  return {
    ...INITIAL_DATA,
    ...state,
    expenses: state.expenses || [],
    debtMonthly: state.debtMonthly || [],
    debtDue: state.debtDue || [],
    unpaid: state.unpaid || [],
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
