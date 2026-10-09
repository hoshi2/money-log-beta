import React from 'react';
import { fmt, getPayoffDate } from '../utils/calc';

export default function Dashboard({ data, totals }) {
  const paidDebt2 = totals.debt2All - totals.debt2Total;

  return (
    <div>
      <div className="section-label">概要</div>

      {/* 純資産 BIG */}
      <div className="nw-big">
        <div className="nw-big-label">⑥ 純資産</div>
        <div className={`nw-big-value ${totals.netWorth >= 0 ? 'pos' : 'neg'}`}>
          {fmt(totals.netWorth)}
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>⑪ 借金②完済率</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>{totals.paidRate.toFixed(1)}%</span>
          </div>
          <div className="progress-wrap">
            <div className="progress-fill" style={{ width: `${Math.min(100, totals.paidRate)}%`, background: 'var(--green)' }} />
          </div>
        </div>
      </div>

      {/* KPI 2x2 */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">① 総資産</div>
          <div className="kpi-value gold">{fmt(totals.totalAssets)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">⑤ 総負債</div>
          <div className="kpi-value red">{fmt(totals.totalDebt)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">② 借金①残高</div>
          <div className="kpi-value red" style={{ fontSize: 15 }}>{fmt(totals.debt1Total)}</div>
          <div className="kpi-sub">月次返済 {fmt(totals.debt1Monthly)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">③ 借金②残高</div>
          <div className="kpi-value red" style={{ fontSize: 15 }}>{fmt(totals.debt2Total)}</div>
          <div className="kpi-sub">{paidDebt2 > 0 ? `✓ ${fmt(paidDebt2)} 完済済` : '未着手'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">④ 未払い残高</div>
          <div className="kpi-value red" style={{ fontSize: 15 }}>{fmt(totals.unpaidTotal)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">⑦ 今月必要資金</div>
          <div className="kpi-value" style={{ fontSize: 15 }}>{fmt(totals.totalExpenses + totals.debt1Monthly)}</div>
        </div>
      </div>

      {/* 月次CF */}
      <div className="kpi-grid" style={{ marginTop: 8 }}>
        <div className="kpi-card wide">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="kpi-label">⑧ 今月あと使える金額</div>
              <div className={`kpi-value ${totals.monthlyCF >= 0 ? 'green' : 'red'}`} style={{ fontSize: 20 }}>
                {fmt(totals.monthlyCF)}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text3)' }}>
              <div>収入 {fmt(totals.totalIncome)}</div>
              <div>支出 {fmt(totals.totalExpenses)}</div>
              <div>返済 {fmt(totals.debt1Monthly)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 7月末 */}
      <div className="july-box">
        <div className="july-box-title">⚡ 7月末入金予定 — 2026.07.31</div>
        <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--green)', marginBottom: 10 }}>
          {fmt(totals.incomingJuly)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>⑩ 入金後の予想負債</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{fmt(totals.afterJulyDebt)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>⑫ 完済予定（借金①）</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold)' }}>
              {getPayoffDate(totals.monthsToPayoff)}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, borderTop: '1px solid var(--green-border)', paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--text3)' }}>入金後 手元残高</span>
            <span style={{ fontWeight: 700, color: totals.incomingJuly - totals.debt2Total >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {fmt(totals.incomingJuly - totals.debt2Total)}
            </span>
          </div>
        </div>
      </div>

      {/* 借金②進捗 */}
      <div className="card">
        <div className="card-title">借金②返済進捗</div>
        {data.debt2.map(d => (
          <div key={d.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 0', borderBottom: '1px solid var(--border)',
            opacity: d.done ? 0.5 : 1, fontSize: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ color: d.done ? 'var(--green)' : 'var(--text3)', fontSize: 13 }}>{d.done ? '✓' : '○'}</span>
              <span style={{ color: 'var(--text)' }}>{d.name}</span>
            </div>
            <span style={{ fontWeight: 700, color: d.done ? 'var(--green)' : 'var(--red)', textDecoration: d.done ? 'line-through' : 'none' }}>
              {fmt(d.amount)}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontWeight: 700 }}>
          <span style={{ color: 'var(--text3)', fontSize: 12 }}>残高</span>
          <span style={{ color: 'var(--red)' }}>{fmt(totals.debt2Total)}</span>
        </div>
      </div>

      {/* 月次返済 */}
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-title">月次返済スケジュール</div>
        {data.debt1.filter(d => d.monthly > 0).map(d => (
          <div key={d.id} style={{
            display: 'flex', justifyContent: 'space-between', padding: '6px 0',
            borderBottom: '1px solid var(--border)', fontSize: 13
          }}>
            <span style={{ color: 'var(--text2)' }}>{d.name}</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 600 }}>{fmt(d.monthly)}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 6 }}>
                {d.monthly > 0 ? `残${Math.ceil(d.balance / d.monthly)}ヶ月` : ''}
              </span>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontWeight: 700, fontSize: 14 }}>
          <span style={{ color: 'var(--text3)' }}>月次合計</span>
          <span style={{ color: 'var(--red)' }}>{fmt(totals.debt1Monthly)}</span>
        </div>
      </div>
    </div>
  );
}
