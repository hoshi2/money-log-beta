export const fmt = (n) =>
  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(n ?? 0);

export const calcTotals = (data) => {
  const totalAssets = data.assets.reduce((s, a) => s + (a.amount || 0), 0);
  const totalIncome = data.income.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenses = data.expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const debt1Total = data.debt1.reduce((s, d) => s + (d.balance || 0), 0);
  const debt1Monthly = data.debt1.reduce((s, d) => s + (d.monthly || 0), 0);
  const debt2Total = data.debt2.filter(d => !d.done).reduce((s, d) => s + (d.amount || 0), 0);
  const debt2All = data.debt2.reduce((s, d) => s + (d.amount || 0), 0);
  const unpaidTotal = data.unpaid.reduce((s, u) => s + (u.amount || 0), 0);
  const totalDebt = debt1Total + debt2Total + unpaidTotal;
  const netWorth = totalAssets - totalDebt;
  const monthlyCF = totalIncome - totalExpenses - debt1Monthly;
  const afterJulyDebt = debt1Total + unpaidTotal + Math.max(0, debt2Total - (data.incomingJuly || 0));
  const paidRate = debt2All > 0 ? ((debt2All - debt2Total) / debt2All * 100) : 0;
  const monthsToPayoff = debt1Monthly > 0 ? Math.ceil(debt1Total / debt1Monthly) : null;

  return {
    totalAssets, totalIncome, totalExpenses, totalDebt,
    debt1Total, debt1Monthly, debt2Total, debt2All,
    unpaidTotal, netWorth, monthlyCF,
    afterJulyDebt, paidRate, monthsToPayoff,
    incomingJuly: data.incomingJuly || 0,
  };
};

export const STORAGE_KEY = 'stella_v2';
export const save = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
};
export const load = () => {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : null;
  } catch(e) { return null; }
};

export const getPayoffDate = (months) => {
  if (!months) return '—';
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
};
