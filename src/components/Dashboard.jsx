import React from 'react';
import { fmt, fmtDate, daysUntil, getPayoffDate } from '../utils/calc';

function dueLabel(d) {
  const n = daysUntil(d.dueDate);
  if (n === null) return { text: '期限なし', cls: '' };
  if (n < 0) return { text: `${-n}日 超過`, cls: 'red' };
  if (n === 0) return { text: '今日', cls: 'red' };
  if (n <= 7) return { text: `あと${n}日`, cls: 'red' };
  return { text: `あと${n}日`, cls: '' };
}

export default function Dashboard({ data, totals, go }) {
  const next = totals.upcoming.slice(0, 3);
  return (
    <div>
      <div className="nw-big" style={{ borderColor: 'var(--red-border)', background: 'var(--red-bg)' }}>
        <div className="nw-big-label" style={{ color: 'var(--red)' }}>借金の総額</div>
        <div className="nw-big-value neg">{fmt(totals.totalDebt)}</div>
        <div className="kpi-sub" style={{ marginTop: 6 }}>
          毎月返済 {fmt(totals.debtMonthlyTotal)} ／ 期限つき {fmt(totals.debtDueTotal)} ／ 未払い {fmt(totals.unpaidTotal)}
        </div>
      </div>

      <div className="section-label">今月の支払い</div>
      <div className="card" style={{ marginTop: 0 }}>
        <div className="row-line"><span>固定費・サブスク（月あたり）</span><b>{fmt(totals.expensesMonthly)}</b></div>
        <div className="row-line"><span>毎月返済の月額</span><b>{fmt(totals.debtMonthlyPayment)}</b></div>
        <div className="row-line"><span>今月が期限の借金</span><b>{fmt(totals.dueThisMonth)}</b></div>
        <div className="divider" />
        <div className="row-line total"><span>合計</span><b className="red">{fmt(totals.thisMonthPay)}</b></div>
        {totals.monthsToPayoff && (
          <div className="kpi-sub" style={{ marginTop: 8 }}>毎月返済の完済予定: 約{totals.monthsToPayoff}ヶ月後（{getPayoffDate(totals.monthsToPayoff)}）</div>
        )}
      </div>

      <div className="section-label">直近の期限</div>
      <div className="card" style={{ marginTop: 0 }}>
        {next.length === 0 && <div className="kpi-sub">期限つきの借金はありません</div>}
        {next.map(d => {
          const l = dueLabel(d);
          return (
            <div key={d.id} className="row-line" onClick={() => go('due')} style={{ cursor: 'pointer' }}>
              <span>
                <span className={`badge ${l.cls === 'red' ? 'badge-red' : 'badge-blue'}`} style={{ marginRight: 8 }}>{fmtDate(d.dueDate)}</span>
                {d.name}
                <span className="kpi-sub" style={{ marginLeft: 6 }}>{l.text}</span>
              </span>
              <b className={l.cls}>{fmt(d.amount)}</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}
