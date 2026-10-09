import React, { useState } from 'react';
import { fmt } from '../utils/calc';
import { genId } from '../data/initial';

export default function Debt1Tab({ data, updateData, totals }) {
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', balance: 0, monthly: 0, note: '' });

  const update = (id, key, val) => {
    updateData(prev => ({ ...prev, debt1: prev.debt1.map(d => d.id === id ? { ...d, [key]: val } : d) }));
  };
  const del = (id) => {
    if (!confirm('削除しますか？')) return;
    updateData(prev => ({ ...prev, debt1: prev.debt1.filter(d => d.id !== id) }));
  };
  const add = () => {
    if (!newItem.name) return;
    updateData(prev => ({ ...prev, debt1: [...prev.debt1, { ...newItem, id: genId() }] }));
    setNewItem({ name: '', balance: 0, monthly: 0, note: '' });
    setAdding(false);
  };

  const sorted = [...data.debt1].sort((a, b) => (b.balance || 0) - (a.balance || 0));

  return (
    <div>
      <div className="nw-big" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
        <div className="nw-big-label" style={{ color: 'var(--red)' }}>借金①総残高</div>
        <div className="nw-big-value neg" style={{ fontSize: 26 }}>{fmt(totals.debt1Total)}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
          月次返済 {fmt(totals.debt1Monthly)} ／ 完済予定 {totals.monthsToPayoff ? `約${totals.monthsToPayoff}ヶ月後` : '—'}
        </div>
      </div>

      <div className="section-label">借金一覧（通常返済中）</div>

      <div style={{ margin: '0 14px' }}>
        {sorted.map(d => (
          <div key={d.id} className="list-item">
            <div className="item-row">
              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setEditId(editId === d.id ? null : d.id)}>
                <div className="item-row">
                  <span className="item-name">{d.name}</span>
                  <span className="item-amount red">{fmt(d.balance)}</span>
                </div>
                <div className="item-sub">
                  月次 {fmt(d.monthly)}
                  {d.monthly > 0 && d.balance > 0 && ` ／ 残${Math.ceil(d.balance / d.monthly)}ヶ月`}
                  {d.note && ` ／ ${d.note}`}
                </div>
                {/* 残高バー */}
                <div className="progress-wrap" style={{ marginTop: 6 }}>
                  <div className="progress-fill" style={{
                    width: `${totals.debt1Total > 0 ? (d.balance / totals.debt1Total * 100) : 0}%`,
                    background: '#ef4444'
                  }} />
                </div>
              </div>
              <button className="btn btn-xs btn-danger" onClick={() => del(d.id)}>削除</button>
            </div>

            {editId === d.id && (
              <div className="edit-panel">
                <div className="input-group">
                  <label className="input-label">名前</label>
                  <input className="input-field" value={d.name} onChange={e => update(d.id, 'name', e.target.value)} />
                </div>
                <div className="input-row">
                  <div className="input-group">
                    <label className="input-label">残高 (¥)</label>
                    <input className="input-field" type="number" inputMode="numeric"
                      value={d.balance || ''} onChange={e => update(d.id, 'balance', Number(e.target.value) || 0)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">月次返済 (¥)</label>
                    <input className="input-field" type="number" inputMode="numeric"
                      value={d.monthly || ''} onChange={e => update(d.id, 'monthly', Number(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">メモ（利率・条件など）</label>
                  <input className="input-field" value={d.note || ''} onChange={e => update(d.id, 'note', e.target.value)} />
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setEditId(null)}>✓ 閉じる</button>
              </div>
            )}
          </div>
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
            <div className="input-row">
              <div className="input-group">
                <label className="input-label">残高 (¥)</label>
                <input className="input-field" type="number" inputMode="numeric"
                  value={newItem.balance || ''}
                  onChange={e => setNewItem(p => ({ ...p, balance: Number(e.target.value) || 0 }))} />
              </div>
              <div className="input-group">
                <label className="input-label">月次返済 (¥)</label>
                <input className="input-field" type="number" inputMode="numeric"
                  value={newItem.monthly || ''}
                  onChange={e => setNewItem(p => ({ ...p, monthly: Number(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">メモ</label>
              <input className="input-field" value={newItem.note}
                onChange={e => setNewItem(p => ({ ...p, note: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={add}>✓ 追加</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>キャンセル</button>
            </div>
          </div>
        )}

        <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>
          + 借金を追加
        </button>
      </div>

      <div className="total-bar" style={{ marginBottom: 16 }}>
        <span className="total-bar-label">総残高</span>
        <span className="total-bar-value" style={{ color: 'var(--red)' }}>{fmt(totals.debt1Total)}</span>
      </div>
    </div>
  );
}
