import React, { useState } from 'react';
import { fmt, fmtDate, daysUntil, todayStr, debtGroup, DEBT_GROUPS, moveItem } from '../utils/calc';
import { genId } from '../data/initial';

const UI_KEY = 'ml-ui-collapsed';
const readCollapsed = () => { try { return JSON.parse(localStorage.getItem(UI_KEY)) || {}; } catch { return {}; } };
const writeCollapsed = (v) => { try { localStorage.setItem(UI_KEY, JSON.stringify(v)); } catch { /* ignore */ } };

function dueInfo(item) {
  if (item.done) return { text: '支払い済み', cls: 'green' };
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
  const isUnpaid = item.kind === 'unpaid';
  return (
    <div className={`list-item${item.done ? ' done' : ''}${warn ? ' warn' : ''}`}>
      <div className="item-row">
        <button className={`check-toggle${item.done ? ' checked' : ''}`} onClick={() => onToggle(item.id)} aria-label="支払い済みにする">✓</button>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
          <div className="item-row">
            <span className="item-name" style={{ textDecoration: item.done ? 'line-through' : 'none' }}>{item.name}</span>
            <span className={`item-amount ${item.done ? 'green' : 'red'}`}>{fmt(item.balance)}</span>
          </div>
          {(info || subLine(item)) && (
            <div className={`item-sub ${info ? info.cls : ''}`}>
              {info && <b>{info.text}</b>}{info && subLine(item) ? ' ／ ' : ''}{subLine(item)}
            </div>
          )}
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
              <label className="input-label">{isUnpaid ? '金額 (¥)' : '残額 (¥)'}</label>
              <input className="input-field" type="number" inputMode="numeric" value={item.balance || ''}
                onChange={e => onUpdate(item.id, 'balance', Number(e.target.value) || 0)} />
            </div>
            {!isUnpaid && (
              <div className="input-group">
                <label className="input-label">月額 (¥)（無ければ空）</label>
                <input className="input-field" type="number" inputMode="numeric" value={item.monthly || ''}
                  onChange={e => onUpdate(item.id, 'monthly', Number(e.target.value) || 0)} />
              </div>
            )}
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
          <div className="input-group">
            <label className="input-label">グループ</label>
            <select className="input-field" value={isUnpaid ? 'unpaid' : 'debt'}
              onChange={e => onUpdate(item.id, 'kind', e.target.value === 'unpaid' ? 'unpaid' : '')}>
              <option value="debt">借金（期限と月額で自動で分かれる）</option>
              <option value="unpaid">未払い</option>
            </select>
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

const EMPTY = () => ({ name: '', balance: 0, monthly: 0, dueDate: '', note: '', kind: '', done: false });

function AddForm({ group, onAdd, onCancel }) {
  const [item, setItem] = useState(() => ({ ...EMPTY(), kind: group === 'unpaid' ? 'unpaid' : '' }));
  const set = (k, v) => setItem(p => ({ ...p, [k]: v }));
  const hint = { due: '期限を入れてください', other: '月額・期限は空のまま', monthly: '月額を入れてください', unpaid: '請求の未払い' }[group];
  const submit = () => {
    if (!item.name) return;
    if (group === 'due' && !item.dueDate) { alert('期限を入れてください'); return; }
    if (group === 'monthly' && !(item.monthly > 0)) { alert('月額を入れてください'); return; }
    onAdd({ ...item, id: genId() });
  };
  return (
    <div className="list-item" style={{ border: '1px dashed var(--accent)', marginTop: 8 }}>
      <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 8, fontWeight: 700 }}>新規追加（{hint}）</div>
      <div className="input-group">
        <label className="input-label">名前</label>
        <input className="input-field" autoFocus value={item.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div className="input-row">
        <div className="input-group">
          <label className="input-label">{group === 'unpaid' ? '金額 (¥)' : '残額 (¥)'}</label>
          <input className="input-field" type="number" inputMode="numeric" value={item.balance || ''} onChange={e => set('balance', Number(e.target.value) || 0)} />
        </div>
        {(group === 'monthly' || group === 'other') && (
          <div className="input-group">
            <label className="input-label">月額 (¥)</label>
            <input className="input-field" type="number" inputMode="numeric" value={item.monthly || ''} onChange={e => set('monthly', Number(e.target.value) || 0)} />
          </div>
        )}
        {group !== 'monthly' && (
          <div className="input-group">
            <label className="input-label">期限{group === 'due' ? '' : '（任意）'}</label>
            <input className="input-field" type="date" value={item.dueDate} min={todayStr()} onChange={e => set('dueDate', e.target.value)} />
          </div>
        )}
      </div>
      <div className="input-group">
        <label className="input-label">メモ</label>
        <input className="input-field" value={item.note} onChange={e => set('note', e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={submit}>✓ 追加</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>キャンセル</button>
      </div>
    </div>
  );
}

export default function DebtsTab({ data, updateData, totals }) {
  const [adding, setAdding] = useState(null); // group key
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggleGroup = (key) => setCollapsed(prev => { const next = { ...prev, [key]: !prev[key] }; writeCollapsed(next); return next; });
  const items = data.debts;

  const update = (id, key, val) => updateData(p => ({ ...p, debts: p.debts.map(d => d.id === id ? { ...d, [key]: val } : d) }));
  const del = (id) => { if (confirm('削除しますか？')) updateData(p => ({ ...p, debts: p.debts.filter(d => d.id !== id) })); };
  const toggle = (id) => updateData(p => ({ ...p, debts: p.debts.map(d => d.id === id ? { ...d, done: !d.done } : d) }));
  const move = (id, dir) => updateData(p => ({ ...p, debts: moveItem(p.debts, id, dir, d => (d.done ? 'done' : debtGroup(d))) }));
  const add = (item) => { updateData(p => ({ ...p, debts: [...p.debts, item] })); setAdding(null); };

  const groups = DEBT_GROUPS.map(g => ({ ...g, items: items.filter(d => !d.done && debtGroup(d) === g.key) }));
  const done = items.filter(d => d.done);
  const groupTotal = { monthly: totals.debtMonthlyGroup, due: totals.debtDueGroup, other: totals.debtOtherGroup, unpaid: totals.unpaidTotal };

  return (
    <div>
      <div className="nw-big" style={{ borderColor: 'var(--red-border)', background: 'var(--red-bg)' }}>
        <div className="nw-big-label" style={{ color: 'var(--red)' }}>借金の総額（未払いを含む）</div>
        <div className="nw-big-value neg" style={{ fontSize: 26 }}>{fmt(totals.totalDebt)}</div>
        <div className="kpi-sub" style={{ marginTop: 4 }}>
          月額合計 {fmt(totals.monthlyPayment)}
          {totals.monthsToPayoff && ` ／ 毎月返済分の完済まで約${totals.monthsToPayoff}ヶ月`}
          {totals.overdue > 0 && <span className="red">　期限切れ {totals.overdue}件</span>}
        </div>
      </div>

      {groups.map(g => {
        const closed = !!collapsed[g.key];
        return (
          <div key={g.key}>
            <button className="group-head-btn" onClick={() => toggleGroup(g.key)} aria-expanded={!closed}>
              <span><span className="chev">{closed ? '▶' : '▼'}</span>{g.label}（{g.items.length}件）<span className="kpi-sub" style={{ marginLeft: 6 }}>{g.hint}</span></span>
              <span className="red">{fmt(groupTotal[g.key])}</span>
            </button>
            {!closed && (
              <div style={{ margin: '0 14px 6px' }}>
                {g.items.length === 0 && adding !== g.key && <div className="kpi-sub" style={{ padding: '2px 0 6px' }}>なし</div>}
                {g.items.map(d => <Row key={d.id} item={d} onUpdate={update} onDelete={del} onToggle={toggle} onMove={move} />)}
                {adding === g.key
                  ? <AddForm group={g.key} onAdd={add} onCancel={() => setAdding(null)} />
                  : <button className="btn btn-ghost btn-full btn-sm" style={{ marginTop: 6 }} onClick={() => setAdding(g.key)}>+ {g.label}を追加</button>}
              </div>
            )}
          </div>
        );
      })}

      {done.length > 0 && (
        <div>
          <button className="group-head-btn" onClick={() => toggleGroup('done')} aria-expanded={!collapsed.done}>
            <span><span className="chev">{collapsed.done ? '▶' : '▼'}</span>支払い済み（{done.length}件）</span>
          </button>
          {!collapsed.done && (
            <div style={{ margin: '0 14px 6px' }}>
              {done.map(d => <Row key={d.id} item={d} onUpdate={update} onDelete={del} onToggle={toggle} onMove={move} />)}
            </div>
          )}
        </div>
      )}

      <div className="total-bar" style={{ marginBottom: 16, marginTop: 12 }}>
        <span className="total-bar-label">借金の総額（未払いを含む）</span>
        <span className="total-bar-value" style={{ color: 'var(--red)' }}>{fmt(totals.totalDebt)}</span>
      </div>
    </div>
  );
}
