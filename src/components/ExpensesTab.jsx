import React from 'react';
import EditableList from './EditableList';
import { fmt, monthlyOf } from '../utils/calc';

const CYCLES = [{ v: 'month', label: '月払い' }, { v: 'year', label: '年払い' }];

export default function ExpensesTab({ data, updateData, totals }) {
  const items = data.expenses;
  const yearly = items.filter(e => e.cycle === 'year').length;
  return (
    <div>
      <div className="nw-big">
        <div className="nw-big-label">固定費・サブスク（月あたり）</div>
        <div className="nw-big-value" style={{ fontSize: 26 }}>{fmt(totals.expensesMonthly)}</div>
        <div className="kpi-sub" style={{ marginTop: 4 }}>{items.length}件{yearly > 0 && `（うち年払い ${yearly}件は12で割って計算）`}</div>
      </div>

      <div className="section-label">一覧</div>
      <div style={{ margin: '0 14px' }}>
        <EditableList
          items={items}
          onUpdate={(id, k, v) => updateData(p => ({ ...p, expenses: p.expenses.map(e => e.id === id ? { ...e, [k]: v } : e) }))}
          onDelete={(id) => { if (confirm('削除しますか？')) updateData(p => ({ ...p, expenses: p.expenses.filter(e => e.id !== id) })); }}
          onAdd={(item) => updateData(p => ({ ...p, expenses: [...p.expenses, item] }))}
          fields={[
            { key: 'cycle', label: '支払い', type: 'select', options: CYCLES, default: 'month' },
            { key: 'note', label: 'メモ', placeholder: '例: 毎月5日' },
          ]}
          subText={(e) => `${e.cycle === 'year' ? `年払い（月あたり ${fmt(monthlyOf(e))}）` : '月払い'}${e.note ? ` ／ ${e.note}` : ''}`}
          colorFn={() => ''}
          addLabel="+ 固定費・サブスクを追加"
          emptyLabel="まだ登録がありません"
        />
      </div>

      <div className="total-bar" style={{ marginBottom: 16 }}>
        <span className="total-bar-label">月あたり合計</span>
        <span className="total-bar-value">{fmt(totals.expensesMonthly)}</span>
      </div>
    </div>
  );
}
