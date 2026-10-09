// 初期データ（ブラウザに保存済みのデータが無いときだけ使われる雛形）。実データはここに書かない。
export const INITIAL_DATA = {
  assets: [
    { id: 'a1', name: '現金', amount: 0 },
    { id: 'a2', name: '個人口座', amount: 0 },
    { id: 'a3', name: '法人口座', amount: 0 },
  ],
  income: [
    { id: 'i1', name: '収入①', amount: 0 },
  ],
  expenses: [
    { id: 'e1', name: '固定費①', amount: 0, category: '生活費' },
  ],
  debt1: [],
  debt2: [],
  unpaid: [],
  incomingJuly: 0,
  memo: '',
};

export const genId = () => Math.random().toString(36).slice(2, 9);
