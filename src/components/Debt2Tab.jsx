import React, { useState } from 'react';
import { fmt } from '../utils/calc';
import { genId } from '../data/initial';

function ItemRow({ item, onUpdate, onDelete, onToggle, isDebt2 }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`list-item${item.done ? ' done' : ''}`}>
      <div className="item-row">
        {isDebt2 && (
          <button className={`check-toggle${item.done ? ' checked' : ''}`} onClick={() => onToggle(item.id)}>✓</button>
        )}
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
          <div className="item-row">
            <span className="item-name" style={{ textDecoration: item.done ? 'line-through' : 'none' }}>{item.name}</span>
            <span className={`item-amount ${item.done ? 'green' : 'red'}`} style={{ textDecoration: item.done ? 'line-through' : 'none' }}>
              {fmt(item.amount)}
            </span>
          </div>
          {isDebt2 && (
            <div className="item-sub">
              {item.dueDate} ／ {item.source} ／ {
                item.status === 'done' ? '完済' : item.status === 'inProgress' ? '準備中' : '未返済'
              }
            </div>
          )}
          {!isDebt2 && item.category && (
            <div className="item-sub">{item.category}{item.note ? ` — ${item.note}` : ''}</div>
          )}
        </div>
        <button className="btn btn-xs btn-danger" onClick={() => onDelete(item.id)}>削除</button>
      </div>

      {open && (
        <div className="edit-panel">
          <div className="input-group">
            <label className="input-label">名前</label>
            <input className="input-field" value={item.name} onChange={e => onUpdate(item.id, 'name', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">金額 (¥)</label>
            <input className="input-field" type="number" inputMode="numeric"
              value={item.amount || ''} onChange={e => onUpdate(item.id, 'amount', Number(e.target.value) || 0)} />
          </div>
          {isDebt2 ? (
            <>
              <div className="input-row">
                <div className="input-group">
                  <label className="input-label">返済予定日</label>
                  <input className="input-field" type="date" value={item.dueDate || ''}
                    onChange={e => onUpdate(item.id, 'dueDate', e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">状況</label>
                  <select className="input-field" value={item.status || 'pending'}
                    onChange={e => onUpdate(item.id, 'status', e.target.value)}>
                    <option value="pending">未返済</option>
                    <option value="inProgress">準備中</option>
                    <option value="done">完済</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">返済原資</label>
                <input className="input-field" value={item.source || ''}
                  onChange={e => onUpdate(item.id, 'source', e.target.value)} />
              </div>
            </>
          ) : (
            <div className="input-row">
              <div className="input-group">
                <label className="input-label">カテゴリ</label>
                <select className="input-field" value={item.category || 'その他'}
                  onChange={e => onUpdate(item.id, 'category', e.target.value)}>
                  {['カード', '携帯', '法人', 'その他'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">メモ</label>
                <input className="input-field" value={item.note || ''}
                  onChange={e => onUpdate(item.id, 'note', e.target.value)} />
              </div>
            </div>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>✓ 閉じる</button>
        </div>
      )}
    </div>
  );
}

export default function Debt2Tab({ data, updateData, totals, mode }) {
  const [adding, setAdding] = useState(false);
  const isDebt2 = mode === 'debt2';
  const listKey = isDebt2 ? 'debt2' : 'unpaid';
  const items = data[listKey];
  const total = isDebt2 ? totals.debt2Total : totals.unpaidTotal;

  const update = (id, key, val) => {
    updateData(prev => ({ ...prev, [listKey]: prev[listKey].map(d => d.id === id ? { ...d, [key]: val } : d) }));
  };
  const del = (id) => {
    if (!confirm('削除しますか？')) return;
    updateData(prev => ({ ...prev, [listKey]: prev[listKey].filter(d => d.id !== id) }));
  };
  const toggle = (id) => {
    updateData(prev => ({ ...prev, debt2: prev.debt2.map(d => d.id === id ? { ...d, done: !d.done } : d) }));
  };

  const [newItem, setNewItem] = useState(
    isDebt2
      ? { name: '', amount: 0, dueDate: '2026-07-31', source: '7月末入金', status: 'pending', done: false }
      : { name: '', amount: 0, category: 'その他', note: '' }
  );

  const add = () => {
    if (!newItem.name) return;
    updateData(prev => ({ ...prev, [listKey]: [...prev[listKey], { ...newItem, id: genId() }] }));
    setNewItem(isDebt2
      ? { name: '', amount: 0, dueDate: '2026-07-31', source: '7月末入金', status: 'pending', done: false }
      : { name: '', amount: 0, category: 'その他', note: '' }
    );
    setAdding(false);
  };

  return (
    <div>
      {/* ヘッダー */}
      <div className="nw-big" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
        <div className="nw-big-label" style={{ color: 'var(--red)' }}>
          {isDebt2 ? '借金②残高（7月末返済）' : '未払い総額'}
        </div>
        <div className="nw-big-value neg" style={{ fontSize: 26 }}>{fmt(total)}</div>
        {isDebt2 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                返済進捗 {items.filter(d => d.done).length}/{items.length}件
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>{totals.paidRate.toFixed(0)}%</span>
            </div>
            <div className="progress-wrap">
              <div className="progress-fill" style={{ width: `${totals.paidRate}%`, background: 'var(--green)' }} />
            </div>
          </div>
        )}
      </div>

      {isDebt2 && (
        <div className="july-box">
          <div className="july-box-title">⚡ 7月末入金 {fmt(totals.incomingJuly)} で返済</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            返済後の手元残高: <strong style={{ color: totals.incomingJuly - totals.debt2Total >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {fmt(totals.incomingJuly - totals.debt2Total)}
            </strong>
          </div>
        </div>
      )}

      <div className="section-label">{isDebt2 ? '返済リスト' : '未払い一覧'}</div>

      <div style={{ margin: '0 14px' }}>
        {items.map(item => (
          <ItemRow key={item.id} item={item} onUpdate={update} onDelete={del} onToggle={toggle} isDebt2={isDebt2} />
        ))}

        {/* 新規追加フォーム */}
        {adding && (
          <div className="list-item" style={{ border: '1px dashed var(--accent)' }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 8, fontWeight: 700 }}>新規追加</div>
            <div className="input-group">
              <label className="input-label">名前</label>
              <input className="input-field" autoFocus value={newItem.name}
                onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">金額 (¥)</label>
              <input className="input-field" type="number" inputMode="numeric"
                value={newItem.amount || ''}
                onChange={e => setNewItem(p => ({ ...p, amount: Number(e.target.value) || 0 }))} />
            </div>
            {isDebt2 ? (
              <>
                <div className="input-row">
                  <div className="input-group">
                    <label className="input-label">返済予定日</label>
                    <input className="input-field" type="date" value={newItem.dueDate}
                      onChange={e => setNewItem(p => ({ ...p, dueDate: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">状況</label>
                    <select className="input-field" value={newItem.status}
                      onChange={e => setNewItem(p => ({ ...p, status: e.target.value }))}>
                      <option value="pending">未返済</option>
                      <option value="inProgress">準備中</option>
                      <option value="done">完済</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">返済原資</label>
                  <input className="input-field" value={newItem.source}
                    onChange={e => setNewItem(p => ({ ...p, source: e.target.value }))} />
                </div>
              </>
            ) : (
              <div className="input-row">
                <div className="input-group">
                  <label className="input-label">カテゴリ</label>
                  <select className="input-field" value={newItem.category}
                    onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
                    {['カード', '携帯', '法人', 'その他'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">メモ</label>
                  <input className="input-field" value={newItem.note}
                    onChange={e => setNewItem(p => ({ ...p, note: e.target.value }))} />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={add}>✓ 追加</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>キャンセル</button>
            </div>
          </div>
        )}

        <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>
          + {isDebt2 ? '返済先を追加' : '未払いを追加'}
        </button>
      </div>

      <div className="total-bar" style={{ marginBottom: 16 }}>
        <span className="total-bar-label">{isDebt2 ? `残高（${items.filter(d => !d.done).length}件）` : `合計（${items.length}件）`}</span>
        <span className="total-bar-value" style={{ color: 'var(--red)' }}>{fmt(total)}</span>
      </div>
    </div>
  );
}
