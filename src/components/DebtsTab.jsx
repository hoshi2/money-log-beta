import React, { useState } from 'react';
import { fmt, fmtDate, daysUntil, todayStr, debtGroup, DEBT_GROUPS, moveItem } from '../utils/calc';
import { genId } from '../data/initial';

function dueInfo(item) {
  if (item.done) return { text: '返済済み', cls: 'green' };
  if (!item.dueDate) return null;
  const n = daysUntil(item.dueDate);
  if (n === null) return null;
  if (n < 0) return { text: `期限切れ（${-n}日超過）`, cls: 'red' };
  if (n === 0) return { text: '今日が期限', cls: 'red' };
  if (n <= 7) return { text: `あと${n}日`, cls: 'red' };
  return { text: `あと${n}日`, cls: '' };
}

function subLine(d) {
  const parts = [];
  if ((d.monthly || 0) > 0) {
    parts.push(`月額 ${fmt(d.monthly)}`);
    if (d.balance > 0) parts.push(`残${Math.ceil(d.balance / d.monthly)}ヶ月`);
  }
  if (d.dueDate) parts.push(`期限 ${fmtDate(d.dueDate)}`);
  if (d.note) parts.push(d.note);
  return parts.join(' ／ ');
}

function Row({ item, onUpdate, onDelete, onToggle, onMove }) {
  const [open, setOpen] = useState(false);
  const info = dueInfo(item);
  const warn = info && info.cls === 'red';
  return (
    <div className={`list-item${item.done ? ' done' : ''}${warn ? ' warn' : ''}`}>
      <div className="item-row">
        <button className={`check-toggle${item.done ? ' checked' : ''}`} onClick={() => onToggle(item.id)} aria-label="返済済みにする">✓</button>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
          <div className="item-row">
            <span className="item-name" style={{ textDecoration: item.done ? 'line-through' : 'none' }}>{item.name}</span>
            <span className={`item-amount ${item.done ? 'green' : 'red'}`}>{fmt(item.balance)}</span>
          </div>
          <div className={`item-sub ${info ? info.cls : ''}`}>
            {info && <b>{info.text}</b>}{info && subLine(item) ? ' ／ ' : ''}{subLine(item)}
          </div>
        </div>
        <div className="move-btns">
          <button className="btn btn-xs btn-ghost" onClick={() => onMove(item.id, -1)} aria-label="上へ">▲</button>
          <button className="btn btn-xs btn-ghost" onClick={() => onMove(item.id, 1)} aria-label="下へ">▼</button>
        </div>
      </div>
      {open && (
        <div className="edit-panel">
          <div className="input-group">
            <label className="input-label">名前</label>
            <input className="input-field" value={item.name} onChange={e => onUpdate(item.id, 'name', e.target.value)} />
          </div>
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">残額 (¥)</label>
              <input className="input-field" type="number" inputMode="numeric" value={item.balance || ''}
                onChange={e => onUpdate(item.id, 'balance', Number(e.target.value) || 0)} />
            </div>
            <div className="input-group">
              <label className="input-label">月額 (¥)（無ければ空）</label>
              <input className="input-field" type="number" inputMode="numeric" value={item.monthly || ''}
                onChange={e => onUpdate(item.id, 'monthly', Number(e.target.value) || 0)} />
            </div>
          </div>
          <div className="input-row">
            <div className="input-group">
              <label className="input-label">期限（無ければ空）</label>
              <input className="input-field" type="date" value={item.dueDate || ''}
                onChange={e => onUpdate(item.id, 'dueDate', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">メモ</label>
              <input className="input-field" value={item.note || ''} onChange={e => onUpdate(item.id, 'note', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>✓ 閉じる</button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(item.id)}>削除</button>
          </div>
        </div>
      )}
    </div>
  );
}

const EMPTY = () => ({ name: '', balance: 0, monthly: 0, dueDate: '', note: '', done: false });

export default function DebtsTab({ data, updateData, totals }) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY);
  const items = data.debts;

  const update = (id, key, val) => updateData(p => ({ ...p, debts: p.debts.map(d => d.id === id ? { ...d, [key]: val } : d) }));
  const del = (id) => { if (confirm('削除しますか？')) updateData(p => ({ ...p, debts: p.debts.filter(d => d.id !== id) })); };
  const toggle = (id) => updateData(p => ({ ...p, debts: p.debts.map(d => d.id === id ? { ...d, done: !d.done } : d) }));
  const move = (id, dir) => updateData(p => ({ ...p, debts: moveItem(p.debts, id, dir, d => (d.done ? 'done' : debtGroup(d))) }));
  const add = () => {
    if (!newItem.name) return;
    updateData(p => ({ ...p, debts: [...p.debts, { ...newItem, id: genId() }] }));
    setNewItem(EMPTY()); setAdding(false);
  };

  const groups = DEBT_GROUPS.map(g => ({ ...g, items: items.filter(d => !d.done && debtGroup(d) === g.key) }));
  const done = items.filter(d => d.done);
  const groupTotal = { monthly: totals.debtMonthlyGroup, due: totals.debtDueGroup, other: totals.debtOtherGroup };

  return (
    <div>
      <div className="nw-big" style={{ borderColor: 'var(--red-border)', background: 'var(--red-bg)' }}>
        <div className="nw-big-label" style={{ color: 'var(--red)' }}>借金（未払いを除く）</div>
        <div className="nw-big-value neg" style={{ fontSize: 26 }}>{fmt(totals.debtTotal)}</div>
        <div className="kpi-sub" style={{ marginTop: 4 }}>
          月額合計 {fmt(totals.monthlyPayment)}
          {totals.monthsToPayoff && ` ／ 毎月返済分の完済まで約${totals.monthsToPayoff}ヶ月`}
          {totals.overdue > 0 && <span className="red">　期限切れ {totals.overdue}件</span>}
        </div>
      </div>

      {groups.map(g => (
        <div key={g.key}>
          <div className="section-label group-head">
            <span>{g.label}（{g.items.length}件）</span>
            <span className="red">{fmt(groupTotal[g.key])}</span>
          </div>
          <div style={{ margin: '0 14px' }}>
            {g.items.length === 0 && <div className="kpi-sub" style={{ padding: '4px 0 8px' }}>なし</div>}
            {g.items.map(d => <Row key={d.id} item={d} onUpdate={update} onDelete={del} onToggle={toggle} onMove={move} />)}
          </div>
        </div>
      ))}

      <div style={{ margin: '0 14px' }}>
        {adding && (
          <div className="list-item" style={{ border: '1px dashed var(--accent)', marginTop: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 8, fontWeight: 700 }}>新規追加（月額・期限は無ければ空のまま）</div>
            <div className="input-group">
              <label className="input-label">名前</label>
              <input className="input-field" autoFocus value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="input-row">
              <div className="input-group">
                <label className="input-label">残額 (¥)</label>
                <input className="input-field" type="number" inputMode="numeric" value={newItem.balance || ''}
                  onChange={e => setNewItem(p => ({ ...p, balance: Number(e.target.value) || 0 }))} />
              </div>
              <div className="input-group">
                <label className="input-label">月額 (¥)</label>
                <input className="input-field" type="number" inputMode="numeric" value={newItem.monthly || ''}
                  onChange={e => setNewItem(p => ({ ...p, monthly: Number(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="input-row">
              <div className="input-group">
                <label className="input-label">期限</label>
                <input className="input-field" type="date" value={newItem.dueDate} min={todayStr()}
                  onChange={e => setNewItem(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">メモ</label>
                <input className="input-field" value={newItem.note} onChange={e => setNewItem(p => ({ ...p, note: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={add}>✓ 追加</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>キャンセル</button>
            </div>
          </div>
        )}
        <button className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => setAdding(true)}>+ 借金を追加</button>

        {done.length > 0 && (
          <>
            <div className="section-label" style={{ paddingLeft: 0 }}>返済済み（{done.length}件）</div>
            {done.map(d => <Row key={d.id} item={d} onUpdate={update} onDelete={del} onToggle={toggle} onMove={move} />)}
          </>
        )}
      </div>

      <div className="total-bar" style={{ marginBottom: 16 }}>
        <span className="total-bar-label">借金の合計（未払いを除く）</span>
        <span className="total-bar-value" style={{ color: 'var(--red)' }}>{fmt(totals.debtTotal)}</span>
      </div>
    </div>
  );
}
