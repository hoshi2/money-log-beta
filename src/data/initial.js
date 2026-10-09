// 初期データ（保存済みデータが無いときだけ使われる空の雛形）。実データはここに書かない。
export const DATA_VERSION = 3;

export const INITIAL_DATA = {
  version: DATA_VERSION,
  expenses: [],  // 固定費・サブスク { id, name, amount, kind: 'sub'|'fixed', cycle: 'month'|'year', note }
  debts: [],     // 借金 { id, name, balance, monthly(任意・0=なし), dueDate(任意・''=なし), kind('unpaid'=未払い、他は空), done, note }
};

export const genId = () => Math.random().toString(36).slice(2, 9);
