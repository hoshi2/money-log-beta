// 変換（v2→v3）と集計の検証。実データのバックアップが ~/Downloads にあれば、それも使って検証する（中身は表示しない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { migrateV2, ensureV3, calcTotals, monthlyOf, daysUntil } from '../src/utils/calc.js';
import { INITIAL_DATA } from '../src/data/initial.js';

const sum = (arr, k) => arr.reduce((s, x) => s + (x[k] || 0), 0);

const sampleV2 = {
  assets: [{ id: 'a1', name: 'x', amount: 10 }],
  income: [{ id: 'i1', name: 'y', amount: 20 }],
  expenses: [{ id: 'e1', name: 'ガス', amount: 3000, category: '生活費' }],
  debt1: [{ id: 'd1', name: 'A', balance: 120000, monthly: 10000, note: '' }],
  debt2: [
    { id: 'r1', name: 'B', amount: 5000, dueDate: '2026-07-31', source: '7月末入金', status: 'pending', done: false },
    { id: 'r2', name: 'C', amount: 7000, dueDate: '2026-07-31', source: '7月末入金', status: 'done', done: false },
  ],
  unpaid: [{ id: 'u1', name: 'D', amount: 900, category: 'カード', note: '' }],
  incomingJuly: 99999, memo: 'm',
};

test('v2 → v3: 件数と金額が保たれ、不要な項目が落ちる', () => {
  const v3 = migrateV2(sampleV2);
  assert.equal(v3.version, 3);
  assert.equal(v3.expenses.length, 1); assert.equal(v3.expenses[0].cycle, 'month');
  assert.equal(v3.debtMonthly.length, 1); assert.equal(v3.debtMonthly[0].balance, 120000);
  assert.equal(v3.debtDue.length, 2); assert.equal(v3.debtDue[1].done, true, 'status=done は done 扱い');
  assert.equal(v3.debtDue[0].dueDate, '2026-07-31');
  assert.equal(v3.unpaid.length, 1);
  assert.ok(!('assets' in v3) && !('income' in v3) && !('incomingJuly' in v3));
  const t = calcTotals(v3);
  assert.equal(t.debtMonthlyTotal, 120000);
  assert.equal(t.debtDueTotal, 5000, '支払い済みは残りに含めない');
  assert.equal(t.unpaidTotal, 900);
  assert.equal(t.totalDebt, 120000 + 5000 + 900);
  assert.equal(t.expensesMonthly, 3000);
  assert.equal(t.thisMonthPay, 3000 + 10000 + 0);
});

test('ensureV3 は v3 をそのまま、v2 は変換、空は null', () => {
  const v3 = migrateV2(sampleV2);
  assert.deepEqual(ensureV3(v3), v3);
  assert.equal(ensureV3(sampleV2).version, 3);
  assert.equal(ensureV3(null), null);
  assert.deepEqual(ensureV3({ version: 3 }), { ...INITIAL_DATA, version: 3 });
});

test('年払いは12で割る、期限の日数', () => {
  assert.equal(monthlyOf({ amount: 12000, cycle: 'year' }), 1000);
  assert.equal(monthlyOf({ amount: 12000, cycle: 'month' }), 12000);
  assert.equal(daysUntil(''), null);
  const d = new Date(); d.setDate(d.getDate() + 3);
  const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  assert.equal(daysUntil(s), 3);
});

test('実データのバックアップ（あれば）: 件数と合計が変換前後で一致', () => {
  const dir = path.join(os.homedir(), 'Downloads');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^money-log-backup-.*\.json$/.test(f)) : [];
  if (files.length === 0) { console.log('  (backup files not found; skipped)'); return; }
  for (const f of files) {
    const old = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const v3 = ensureV3(old);
    const t = calcTotals(v3);
    assert.equal(v3.expenses.length, (old.expenses || []).length);
    assert.equal(v3.debtMonthly.length, (old.debt1 || []).length);
    assert.equal(v3.debtDue.length, (old.debt2 || []).length);
    assert.equal(v3.unpaid.length, (old.unpaid || []).length);
    assert.equal(t.debtMonthlyTotal, sum(old.debt1 || [], 'balance'));
    assert.equal(t.debtDueTotal, sum((old.debt2 || []).filter(d => !(d.done || d.status === 'done')), 'amount'));
    assert.equal(t.unpaidTotal, sum(old.unpaid || [], 'amount'));
    assert.equal(t.expensesMonthly, sum(old.expenses || [], 'amount'));
    assert.deepEqual(ensureV3(v3), v3, 'two-pass idempotent');
    console.log(`  ${f}: ok (expenses=${v3.expenses.length}, monthly=${v3.debtMonthly.length}, due=${v3.debtDue.length}, unpaid=${v3.unpaid.length})`);
  }
});
