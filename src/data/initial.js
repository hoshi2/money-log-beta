// 初期データ（保存済みデータが無いときだけ使われる空の雛形）。実データはここに書かない。
export const DATA_VERSION = 3;

export const INITIAL_DATA = {
  version: DATA_VERSION,
  expenses: [],     // 固定費・サブスク { id, name, amount, cycle: 'month'|'year', note }
  debtMonthly: [],  // 毎月返済している借金 { id, name, balance, monthly, note }
  debtDue: [],      // 期限つき借金 { id, name, amount, dueDate, done, note }
  unpaid: [],       // 未払い { id, name, amount, category, note }
};

export const genId = () => Math.random().toString(36).slice(2, 9);
