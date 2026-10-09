import React, { useState } from 'react';
import { fmt } from '../utils/calc';
import { genId } from '../data/initial';

export default function EditableList({
  items,
  onUpdate,
  onDelete,
  onAdd,
  fields, // [{key, label, type, options}]
  amountKey = 'amount',
  nameKey = 'name',
  colorFn = () => 'red',
  showDone = false,
  onToggleDone,
  addLabel = '+ 追加',
  emptyLabel = 'データなし',
}) {
  const [editId, setEditId] = useState(null);
  const [newItem, setNewItem] = useState(null);

  const handleAdd = () => {
    const base = { id: genId(), [nameKey]: '', [amountKey]: 0 };
    fields.forEach(f => { if (!(f.key in base)) base[f.key] = f.default ?? ''; });
    setNewItem(base);
  };

  const handleSaveNew = () => {
    if (!newItem[nameKey]) return;
    onAdd(newItem);
    setNewItem(null);
  };

  return (
    <div>
      {items.length === 0 && !newItem && (
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '20px 0' }}>{emptyLabel}</div>
      )}

      {items.map(item => (
        <div key={item.id} className={`list-item${item.done ? ' done' : ''}`}>
          <div className="item-row">
            {showDone && (
              <button
                className={`check-toggle${item.done ? ' checked' : ''}`}
                onClick={() => onToggleDone(item.id)}
              >✓</button>
            )}
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setEditId(editId === item.id ? null : item.id)}>
              <div className="item-row" style={{ gap: 6 }}>
                <span className="item-name" style={{ textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item[nameKey]}
                </span>
                <span className={`item-amount ${item.done ? 'green' : colorFn(item)}`}>
                  {fmt(item[amountKey])}
                </span>
              </div>
              {fields.filter(f => f.showSub && item[f.key]).map(f => (
                <div key={f.key} className="item-sub">{f.subLabel || f.label}: {item[f.key]}</div>
              ))}
            </div>
            <button
              className="btn btn-xs btn-danger"
              style={{ flexShrink: 0 }}
              onClick={() => onDelete(item.id)}
            >削除</button>
          </div>

          {editId === item.id && (
            <div className="edit-panel">
              <div className="input-group">
                <label className="input-label">名前</label>
                <input className="input-field" value={item[nameKey]}
                  onChange={e => onUpdate(item.id, nameKey, e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">金額 (¥)</label>
                <input className="input-field" type="number" inputMode="numeric"
                  value={item[amountKey] || ''}
                  onChange={e => onUpdate(item.id, amountKey, Number(e.target.value) || 0)} />
              </div>
              {fields.filter(f => f.key !== nameKey && f.key !== amountKey).map(f => (
                <div key={f.key} className="input-group">
                  <label className="input-label">{f.label}</label>
                  {f.type === 'select' ? (
                    <select className="input-field" value={item[f.key] || ''}
                      onChange={e => onUpdate(item.id, f.key, e.target.value)}>
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="input-field" type={f.type || 'text'}
                      value={item[f.key] || ''} placeholder={f.placeholder || ''}
                      onChange={e => onUpdate(item.id, f.key, f.type === 'number' ? (Number(e.target.value) || 0) : e.target.value)} />
                  )}
                </div>
              ))}
              <button className="btn btn-primary btn-sm" onClick={() => setEditId(null)}>✓ 閉じる</button>
            </div>
          )}
        </div>
      ))}

      {/* 新規追加フォーム */}
      {newItem && (
        <div className="list-item" style={{ border: '1px dashed var(--accent)' }}>
          <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>新規追加</div>
          <div className="input-group">
            <label className="input-label">名前</label>
            <input className="input-field" autoFocus value={newItem[nameKey]}
              onChange={e => setNewItem(p => ({ ...p, [nameKey]: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">金額 (¥)</label>
            <input className="input-field" type="number" inputMode="numeric"
              value={newItem[amountKey] || ''}
              onChange={e => setNewItem(p => ({ ...p, [amountKey]: Number(e.target.value) || 0 }))} />
          </div>
          {fields.filter(f => f.key !== nameKey && f.key !== amountKey).map(f => (
            <div key={f.key} className="input-group">
              <label className="input-label">{f.label}</label>
              {f.type === 'select' ? (
                <select className="input-field" value={newItem[f.key] || f.default || ''}
                  onChange={e => setNewItem(p => ({ ...p, [f.key]: e.target.value }))}>
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input className="input-field" type={f.type || 'text'}
                  value={newItem[f.key] || ''} placeholder={f.placeholder || ''}
                  onChange={e => setNewItem(p => ({ ...p, [f.key]: e.target.value }))} />
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handleSaveNew}>✓ 保存</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setNewItem(null)}>キャンセル</button>
          </div>
        </div>
      )}

      <div className="add-area">
        <button className="btn btn-ghost btn-full" style={{ marginTop: 4 }} onClick={handleAdd}>
          {addLabel}
        </button>
      </div>
    </div>
  );
}
