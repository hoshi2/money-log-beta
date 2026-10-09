import React from 'react';
import EditableList from './EditableList';
import { fmt, moveItem } from '../utils/calc';

const CATS = ['カード', '携帯', '法人', 'その他'].map(c => ({ v: c, label: c }));

export default function UnpaidTab({ data, updateData, totals }) {
  const items = data.unpaid;
  return (
    <div>
      <div className="nw-big" style={{ borderColor: 'var(--red-border)', background: 'var(--red-bg)' }}>
        <div className="nw-big-label" style={{ color: 'var(--red)' }}>未払いの合計</div>
        <div className="nw-big-value neg" style={{ fontSize: 26 }}>{fmt(totals.unpaidTotal)}</div>
        <div className="kpi-sub" style={{ marginTop: 4 }}>{items.length}件</div>
      </div>

      <div className="section-label">未払い一覧</div>
      <div style={{ margin: '0 14px' }}>
        <EditableList
          items={items}
          onUpdate={(id, k, v) => updateData(p => ({ ...p, unpaid: p.unpaid.map(u => u.id === id ? { ...u, [k]: v } : u) }))}
          onDelete={(id) => { if (confirm('削除しますか？')) updateData(p => ({ ...p, unpaid: p.unpaid.filter(u => u.id !== id) })); }}
          onAdd={(item) => updateData(p => ({ ...p, unpaid: [...p.unpaid, item] }))}
          onMove={(id, dir) => updateData(p => ({ ...p, unpaid: moveItem(p.unpaid, id, dir) }))}
          fields={[
            { key: 'category', label: 'カテゴリ', type: 'select', options: CATS, default: 'その他' },
            { key: 'note', label: 'メモ' },
          ]}
          subText={(u) => `${u.category || 'その他'}${u.note ? ` — ${u.note}` : ''}`}
          addLabel="+ 未払いを追加"
          emptyLabel="未払いはありません"
        />
      </div>

      <div className="total-bar" style={{ marginBottom: 16 }}>
        <span className="total-bar-label">合計（{items.length}件）</span>
        <span className="total-bar-value" style={{ color: 'var(--red)' }}>{fmt(totals.unpaidTotal)}</span>
      </div>
    </div>
  );
}
