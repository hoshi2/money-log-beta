import React from 'react';
import { fmt } from '../utils/calc';
import EditableList from './EditableList';

export default function AssetsTab({ data, updateData, totals }) {
  const makeUpdater = (key) => (id, field, val) => {
    updateData(prev => ({ ...prev, [key]: prev[key].map(i => i.id === id ? { ...i, [field]: val } : i) }));
  };
  const makeDeleter = (key) => (id) => {
    updateData(prev => ({ ...prev, [key]: prev[key].filter(i => i.id !== id) }));
  };
  const makeAdder = (key) => (item) => {
    updateData(prev => ({ ...prev, [key]: [...prev[key], item] }));
  };

  return (
    <div>
      {/* 総資産 */}
      <div className="nw-big" style={{ borderColor: '#d4a017', background: '#fefce8' }}>
        <div className="nw-big-label" style={{ color: 'var(--gold)' }}>総資産</div>
        <div className="nw-big-value" style={{ color: 'var(--gold)', fontSize: 26 }}>{fmt(totals.totalAssets)}</div>
      </div>

      {/* 資産 */}
      <div className="section-label">資産</div>
      <div style={{ margin: '0 14px' }}>
        <EditableList
          items={data.assets}
          onUpdate={makeUpdater('assets')}
          onDelete={makeDeleter('assets')}
          onAdd={makeAdder('assets')}
          fields={[]}
          amountKey="amount"
          colorFn={() => 'gold'}
          addLabel="+ 資産を追加"
        />
      </div>

      {/* 7月末入金 */}
      <div className="section-label">⚡ 7月末入金予定</div>
      <div className="card">
        <div className="input-group">
          <label className="input-label">入金予定額 (¥)</label>
          <input className="input-field" type="number" inputMode="numeric"
            value={data.incomingJuly || ''}
            onChange={e => updateData(prev => ({ ...prev, incomingJuly: Number(e.target.value) || 0 }))}
          />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>この金額が借金②の返済原資として計算されます</div>
      </div>

      {/* 月次収入 */}
      <div className="section-label">月次収入</div>
      <div style={{ margin: '0 14px' }}>
        <EditableList
          items={data.income}
          onUpdate={makeUpdater('income')}
          onDelete={makeDeleter('income')}
          onAdd={makeAdder('income')}
          fields={[]}
          amountKey="amount"
          colorFn={() => 'green'}
          addLabel="+ 収入を追加"
        />
      </div>
      <div className="total-bar">
        <span className="total-bar-label">月次収入合計</span>
        <span className="total-bar-value" style={{ color: 'var(--green)' }}>{fmt(totals.totalIncome)}</span>
      </div>

      {/* 月次支出 */}
      <div className="section-label">月次固定支出</div>
      <div style={{ margin: '0 14px' }}>
        <EditableList
          items={data.expenses}
          onUpdate={makeUpdater('expenses')}
          onDelete={makeDeleter('expenses')}
          onAdd={makeAdder('expenses')}
          fields={[
            { key: 'category', label: 'カテゴリ', type: 'select', options: ['生活費', '法人', 'その他'], showSub: true }
          ]}
          amountKey="amount"
          colorFn={() => 'red'}
          addLabel="+ 支出を追加"
        />
      </div>
      <div className="total-bar" style={{ marginBottom: 16 }}>
        <span className="total-bar-label">月次支出合計</span>
        <span className="total-bar-value" style={{ color: 'var(--red)' }}>{fmt(totals.totalExpenses)}</span>
      </div>
    </div>
  );
}
