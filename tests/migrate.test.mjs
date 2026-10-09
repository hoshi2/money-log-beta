// 変換（v2→現行）と集計・並び替えの検証。実データのバックアップが ~/Downloads にあれば、それも使って検証する（中身は表示しない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { migrateV2, ensureV3, calcTotals, monthlyOf, daysUntil, moveItem, debtGroup } from '../src/utils/calc.js';
import { INITIAL_DATA } from '../src/data/initial.js';

const sum = (arr, k) => arr.reduce((s, x) => s + (x[k] || 0), 0);

const sampleV2 = {
  assets: [{ id: 'a1', name: 'x', amount: 10 }],
  income: [{ id: 'i1', name: 'y', amount: 20 }],
  expenses: [{ id: 'e1', name: 'ガス', amount: 3000, category: '生活費' }, { id: 'e2', name: 'ChatGPT', amount: 3000, category: '生活費' }],
  debt1: [{ id: 'd1', name: 'A', balance: 120000, monthly: 10000, note: '' }],
  debt2: [
    { id: 'r1', name: 'B', amount: 5000, dueDate: '2026-07-31', source: '7月末入金', status: 'pending', done: false },
    { id: 'r2', name: 'C', amount: 7000, dueDate: '2026-07-31', source: '7月末入金', status: 'done', done: false },
  ],
  unpaid: [{ id: 'u1', name: 'D', amount: 900, category: 'カード', note: '' }],
  incomingJuly: 99999, memo: 'm',
};

test('v2 → 現行: 件数と金額が保たれ、不要な項目が落ちる', () => {
  const v3 = migrateV2(sampleV2);
  assert.equal(v3.version, 3);
  assert.equal(v3.expenses.length, 2);
  assert.equal(v3.expenses[0].kind, 'fixed'); assert.equal(v3.expenses[1].kind, 'sub', 'ChatGPT はサブスク扱い');
  assert.equal(v3.debts.length, 3, '借金①と借金Ⅱが1つの一覧になる');
  assert.equal(debtGroup(v3.debts[0]), 'monthly');
  assert.equal(debtGroup(v3.debts[1]), 'due');
  assert.equal(v3.debts[2].done, true, 'status=done は返済済み扱い');
  assert.equal(v3.debts[1].balance, 5000, '借金Ⅱの amount は残額になる');
  assert.equal(v3.unpaid.length, 1);
  assert.ok(!('assets' in v3) && !('income' in v3) && !('incomingJuly' in v3));
  const t = calcTotals(v3);
  assert.equal(t.debtMonthlyGroup, 120000);
  assert.equal(t.debtDueGroup, 5000, '返済済みは残りに含めない');
  assert.equal(t.debtOtherGroup, 0);
  assert.equal(t.unpaidTotal, 900);
  assert.equal(t.totalDebt, 120000 + 5000 + 900);
  assert.equal(t.subsMonthly, 3000); assert.equal(t.fixedMonthly, 3000);
  assert.equal(t.thisMonthPay, 6000 + 10000 + 0);
});

test('月額も期限も無い借金は「その他」', () => {
  const s = ensureV3({ version: 3, debts: [{ id: 'x', name: 'n', balance: 100 }], expenses: [], unpaid: [] });
  assert.equal(debtGroup(s.debts[0]), 'other');
  assert.equal(calcTotals(s).debtOtherGroup, 100);
});

test('ensureV3: 現行はそのまま、v2 は変換、ベータ初期の形も吸収、空は null', () => {
  const v3 = migrateV2(sampleV2);
  assert.deepEqual(ensureV3(v3), v3);
  assert.equal(ensureV3(sampleV2).version, 3);
  assert.equal(ensureV3(null), null);
  assert.deepEqual(ensureV3({ version: 3 }), INITIAL_DATA);
  const interim = { version: 3, expenses: [], unpaid: [], debtMonthly: [{ id: 'm', name: 'M', balance: 10, monthly: 1 }], debtDue: [{ id: 'd', name: 'D', amount: 20, dueDate: '2026-12-01', done: false }] };
  const merged = ensureV3(interim);
  assert.equal(merged.debts.length, 2); assert.equal(merged.debts[1].balance, 20);
});

test('年払いは12で割る、期限の日数', () => {
  assert.equal(monthlyOf({ amount: 12000, cycle: 'year' }), 1000);
  assert.equal(monthlyOf({ amount: 12000, cycle: 'month' }), 12000);
  assert.equal(daysUntil(''), null);
  const d = new Date(); d.setDate(d.getDate() + 3);
  const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  assert.equal(daysUntil(s), 3);
});

test('並び替えは同じグループの中だけで入れ替わる', () => {
  const list = [
    { id: '1', g: 'a' }, { id: '2', g: 'b' }, { id: '3', g: 'a' }, { id: '4', g: 'b' },
  ];
  const g = x => x.g;
  assert.deepEqual(moveItem(list, '3', -1, g).map(x => x.id), ['3', '2', '1', '4'], 'a同士で入れ替え、bは動かない');
  assert.deepEqual(moveItem(list, '1', -1, g).map(x => x.id), ['1', '2', '3', '4'], '先頭はそのまま');
  assert.deepEqual(moveItem(list, '2', 1, g).map(x => x.id), ['1', '4', '3', '2']);
  assert.deepEqual(moveItem(list, 'zz', 1, g), list);
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
    assert.equal(v3.debts.length, (old.debt1 || []).length + (old.debt2 || []).length);
    assert.equal(v3.unpaid.length, (old.unpaid || []).length);
    assert.equal(t.debtMonthlyGroup, sum((old.debt1 || []).filter(d => (d.monthly || 0) > 0), 'balance'));
    assert.equal(t.debtDueGroup + t.debtOtherGroup, sum((old.debt1 || []).filter(d => !(d.monthly > 0)), 'balance') + sum((old.debt2 || []).filter(d => !(d.done || d.status === 'done')), 'amount'));
    assert.equal(t.debtTotal, sum(old.debt1 || [], 'balance') + sum((old.debt2 || []).filter(d => !(d.done || d.status === 'done')), 'amount'));
    assert.equal(t.unpaidTotal, sum(old.unpaid || [], 'amount'));
    assert.equal(t.expensesMonthly, sum(old.expenses || [], 'amount'));
    assert.deepEqual(ensureV3(v3), v3, 'two-pass idempotent');
    console.log(`  ${f}: ok (expenses=${v3.expenses.length} [sub=${v3.expenses.filter(e => e.kind === 'sub').length}], debts=${v3.debts.length} [monthly=${v3.debts.filter(d => debtGroup(d) === 'monthly').length}, due=${v3.debts.filter(d => debtGroup(d) === 'due').length}, other=${v3.debts.filter(d => debtGroup(d) === 'other').length}], unpaid=${v3.unpaid.length})`);
  }
});
