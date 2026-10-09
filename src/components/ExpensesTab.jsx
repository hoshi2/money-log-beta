import React from 'react';
import EditableList from './EditableList';
import { fmt, monthlyOf, moveItem, EXPENSE_KINDS } from '../utils/calc';

const CYCLES = [{ v: 'month', label: '月払い' }, { v: 'year', label: '年払い' }];
const KINDS = EXPENSE_KINDS.map(k => ({ v: k.key, label: k.label }));
const kindOf = (e) => (e.kind === 'sub' ? 'sub' : 'fixed');

export default function ExpensesTab({ data, updateData, totals }) {
  const items = data.expenses;
  const common = {
    onUpdate: (id, k, v) => updateData(p => ({ ...p, expenses: p.expenses.map(e => e.id === id ? { ...e, [k]: v } : e) })),
    onDelete: (id) => { if (confirm('削除しますか？')) updateData(p => ({ ...p, expenses: p.expenses.filter(e => e.id !== id) })); },
    onMove: (id, dir) => updateData(p => ({ ...p, expenses: moveItem(p.expenses, id, dir, kindOf) })),
    fields: [
      { key: 'kind', label: '種類', type: 'select', options: KINDS, default: 'fixed' },
      { key: 'cycle', label: '支払い', type: 'select', options: CYCLES, default: 'month' },
      { key: 'note', label: 'メモ', placeholder: '例: 毎月5日' },
    ],
    subText: (e) => `${e.cycle === 'year' ? `年払い（月あたり ${fmt(monthlyOf(e))}）` : '月払い'}${e.note ? ` ／ ${e.note}` : ''}`,
    colorFn: () => '',
  };
  const groupTotal = { sub: totals.subsMonthly, fixed: totals.fixedMonthly };

  return (
    <div>
      <div className="nw-big">
        <div className="nw-big-label">固定費・サブスク（月あたり）</div>
        <div className="nw-big-value" style={{ fontSize: 26 }}>{fmt(totals.expensesMonthly)}</div>
        <div className="kpi-sub" style={{ marginTop: 4 }}>サブスク {fmt(totals.subsMonthly)} ／ 固定費 {fmt(totals.fixedMonthly)}（年払いは12で割って計算）</div>
      </div>

      {EXPENSE_KINDS.map(k => {
        const list = items.filter(e => kindOf(e) === k.key);
        return (
          <div key={k.key}>
            <div className="section-label group-head">
              <span>{k.label}（{list.length}件）</span>
              <span>{fmt(groupTotal[k.key])}</span>
            </div>
            <div style={{ margin: '0 14px' }}>
              <EditableList
                {...common}
                items={list}
                onAdd={(item) => updateData(p => ({ ...p, expenses: [...p.expenses, { ...item, kind: k.key }] }))}
                addLabel={`+ ${k.label}を追加`}
                emptyLabel="なし"
              />
            </div>
          </div>
        );
      })}

      <div className="total-bar" style={{ marginBottom: 16 }}>
        <span className="total-bar-label">月あたり合計</span>
        <span className="total-bar-value">{fmt(totals.expensesMonthly)}</span>
      </div>
    </div>
  );
}
