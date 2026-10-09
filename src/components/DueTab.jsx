import React, { useState } from 'react';
import { fmt, fmtDate, daysUntil, todayStr } from '../utils/calc';
import { genId } from '../data/initial';

function dueInfo(item) {
  if (item.done) return { text: '支払い済み', cls: 'green' };
  const n = daysUntil(item.dueDate);
  if (n === null) return { text: '期限なし', cls: '' };
  if (n < 0) return { text: `期限切れ（${-n}日超過）`, cls: 'red' };
  if (n === 0) return { text: '今日が期限', cls: 'red' };
  if (n <= 7) return { text: `あと${n}日`, cls: 'red' };
  return { text: `あと${n}日`, cls: '' };
}

function Row({ item, onUpdate, onDelete, onToggle }) {
  const [open, setOpen] = useState(false);
  const info = dueInfo(item);
  return (
    <div className={`list-item${item.done ? ' done' : ''}${info.cls === 'red' ? ' warn' : ''}`}>
      <div className="item-row">
        <button className={`check-toggle${item.done ? ' checked' : ''}`} onClick={() => onToggle(item.id)} aria-label="支払い済みにする">✓</button>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
          <div className="item-row">
            <span className="item-name" style={{ textDecoration: item.done ? 'line-through' : 'none' }}>{item.name}</span>
            <span className={`item-amount ${item.done ? 'green' : 'red'}`}>{fmt(item.amount)}</span>
          </div>
          <div className={`item-sub ${info.cls}`}>
            <b>{fmtDate(item.dueDate)}</b> ／ {info.text}{item.note ? ` ／ ${item.note}` : ''}
          </div>
        </div>
        <button className="btn btn-xs btn-danger" onClick={() => onDelete(item.id)}>削除</button>
      </div>
      {open && (
        <div className="edit-panel">
          <div className="input-group">
            <label className="input-label">名前</label>
            <input className="input-field" value={item.name} onChange={e => onUpdate(item.id, 'name', e.target.value)} />
          </div>
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">金額 (¥)</label>
              <input className="input-field" type="number" inputMode="numeric" value={item.amount || ''}
                onChange={e => onUpdate(item.id, 'amount', Number(e.target.value) || 0)} />
            </div>
            <div className="input-group">
              <label className="input-label">期限</label>
              <input className="input-field" type="date" value={item.dueDate || ''}
                onChange={e => onUpdate(item.id, 'dueDate', e.target.value)} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">メモ（返済の原資など）</label>
            <input className="input-field" value={item.note || ''} onChange={e => onUpdate(item.id, 'note', e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>✓ 閉じる</button>
        </div>
      )}
    </div>
  );
}

const EMPTY = () => ({ name: '', amount: 0, dueDate: '', note: '', done: false });

export default function DueTab({ data, updateData, totals }) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY);
  const items = data.debtDue;

  const update = (id, key, val) => updateData(p => ({ ...p, debtDue: p.debtDue.map(d => d.id === id ? { ...d, [key]: val } : d) }));
  const del = (id) => { if (confirm('削除しますか？')) updateData(p => ({ ...p, debtDue: p.debtDue.filter(d => d.id !== id) })); };
  const toggle = (id) => updateData(p => ({ ...p, debtDue: p.debtDue.map(d => d.id === id ? { ...d, done: !d.done } : d) }));
  const add = () => {
    if (!newItem.name) return;
    updateData(p => ({ ...p, debtDue: [...p.debtDue, { ...newItem, id: genId() }] }));
    setNewItem(EMPTY()); setAdding(false);
  };

  // 未払いを期限順（期限なしは最後）→ 支払い済みは下
  const key = d => (d.dueDate || '9999-12-31');
  const open = items.filter(d => !d.done).sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
  const done = items.filter(d => d.done).sort((a, b) => key(b) < key(a) ? -1 : 1);
  const overdue = open.filter(d => { const n = daysUntil(d.dueDate); return n !== null && n < 0; }).length;

  return (
    <div>
      <div className="nw-big" style={{ borderColor: 'var(--red-border)', background: 'var(--red-bg)' }}>
        <div className="nw-big-label" style={{ color: 'var(--red)' }}>期限つき借金（未払い分）</div>
        <div className="nw-big-value neg" style={{ fontSize: 26 }}>{fmt(totals.debtDueTotal)}</div>
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span className="kpi-sub">支払い済み {done.length}/{items.length}件{overdue > 0 && <span className="red">　期限切れ {overdue}件</span>}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>{totals.paidRate.toFixed(0)}%</span>
          </div>
          <div className="progress-wrap"><div className="progress-fill" style={{ width: `${totals.paidRate}%`, background: 'var(--green)' }} /></div>
        </div>
      </div>

      <div className="section-label">期限順（7日以内と期限切れは赤）</div>
      <div style={{ margin: '0 14px' }}>
        {open.length === 0 && !adding && <div className="kpi-sub" style={{ textAlign: 'center', padding: '16px 0' }}>未払いの期限つき借金はありません</div>}
        {open.map(d => <Row key={d.id} item={d} onUpdate={update} onDelete={del} onToggle={toggle} />)}

        {adding && (
          <div className="list-item" style={{ border: '1px dashed var(--accent)' }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 8, fontWeight: 700 }}>新規追加</div>
            <div className="input-group">
              <label className="input-label">名前</label>
              <input className="input-field" autoFocus value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="input-row">
              <div className="input-group">
                <label className="input-label">金額 (¥)</label>
                <input className="input-field" type="number" inputMode="numeric" value={newItem.amount || ''}
                  onChange={e => setNewItem(p => ({ ...p, amount: Number(e.target.value) || 0 }))} />
              </div>
              <div className="input-group">
                <label className="input-label">期限</label>
                <input className="input-field" type="date" value={newItem.dueDate} min={todayStr()}
                  onChange={e => setNewItem(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">メモ（返済の原資など）</label>
              <input className="input-field" value={newItem.note} onChange={e => setNewItem(p => ({ ...p, note: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={add}>✓ 追加</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>キャンセル</button>
            </div>
          </div>
        )}
        <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>+ 期限つき借金を追加</button>

        {done.length > 0 && (
          <>
            <div className="section-label" style={{ paddingLeft: 0 }}>支払い済み</div>
            {done.map(d => <Row key={d.id} item={d} onUpdate={update} onDelete={del} onToggle={toggle} />)}
          </>
        )}
      </div>

      <div className="total-bar" style={{ marginBottom: 16 }}>
        <span className="total-bar-label">未払い分（{open.length}件）</span>
        <span className="total-bar-value" style={{ color: 'var(--red)' }}>{fmt(totals.debtDueTotal)}</span>
      </div>
    </div>
  );
}
