import React from 'react';
import { fmt } from '../utils/calc';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

export default function CFTab({ data, totals }) {
  const now = new Date();
  const forecast = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + i);
    const net = totals.monthlyCF;
    return { label: `${d.getMonth() + 1}月`, net };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
        <div style={{ color: 'var(--text3)' }}>{label}</div>
        <div style={{ fontWeight: 700, color: payload[0].value >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(payload[0].value)}</div>
      </div>
    );
  };

  return (
    <div>
      <div className="section-label">月次キャッシュフロー</div>

      {/* サマリ */}
      <div style={{ margin: '0 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: '月収入', val: totals.totalIncome, color: 'var(--green)' },
          { label: '月支出', val: totals.totalExpenses, color: 'var(--red)' },
          { label: '月返済', val: totals.debt1Monthly, color: 'var(--red)' },
        ].map(item => (
          <div key={item.label} className="kpi-card">
            <div className="kpi-label">{item.label}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: item.color }}>{fmt(item.val)}</div>
          </div>
        ))}
      </div>

      <div className="kpi-grid" style={{ marginTop: 8 }}>
        <div className="kpi-card wide">
          <div className="kpi-label">月次CF（収入 − 支出 − 返済）</div>
          <div className={`kpi-value ${totals.monthlyCF >= 0 ? 'green' : 'red'}`} style={{ fontSize: 22 }}>
            {fmt(totals.monthlyCF)}
          </div>
        </div>
      </div>

      {/* 6ヶ月予測 */}
      <div className="card">
        <div className="card-title">月次CF予測（6ヶ月）</div>
        {totals.totalIncome === 0 && (
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>
            ↑ 資産タブで月次収入を入力すると予測が変わります
          </div>
        )}
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={forecast} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: '#8896a8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8896a8', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v >= 0 ? '' : '-'}${Math.abs(v / 10000)}万`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#dde3ed" />
            <Bar dataKey="net" radius={[4, 4, 0, 0]}>
              {forecast.map((e, i) => <Cell key={i} fill={e.net >= 0 ? '#16a34a' : '#dc2626'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 7月末シミュレーション */}
      <div className="july-box">
        <div className="july-box-title">⚡ 7月末シミュレーション</div>
        {[
          { label: '入金額', val: totals.incomingJuly, plus: true },
          { label: '借金②全額返済', val: totals.debt2Total, plus: false },
          { label: '手元残高', val: totals.incomingJuly - totals.debt2Total, highlight: true },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--green-border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{row.label}</span>
            <span style={{
              fontWeight: 700, fontSize: 14,
              color: row.highlight
                ? (row.val >= 0 ? 'var(--green)' : 'var(--red)')
                : (row.plus ? 'var(--green)' : 'var(--red)')
            }}>
              {row.plus ? '' : '−'}{fmt(Math.abs(row.val))}
            </span>
          </div>
        ))}
      </div>

      {/* 支出内訳 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">固定支出内訳</div>
        {['生活費', '法人', 'その他'].map(cat => {
          const catItems = data.expenses.filter(e => e.category === cat);
          if (!catItems.length) return null;
          const catTotal = catItems.reduce((s, e) => s + (e.amount || 0), 0);
          return (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>{cat}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{fmt(catTotal)}</span>
              </div>
              {catItems.map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: 12 }}>
                  <span style={{ color: 'var(--text2)' }}>{e.name}</span>
                  <span style={{ color: 'var(--text)' }}>{fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
