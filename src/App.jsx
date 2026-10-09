import React, { useState, useCallback, useEffect, useRef } from 'react';
import { INITIAL_DATA } from './data/initial';
import { calcTotals, fmt, save, load, loadLegacy, ensureV3, IS_BETA } from './utils/calc';
import { loadCloud, connectCloud, cloudPull, cloudPullLegacy, cloudPush, cloudSubscribe } from './utils/cloud';
import Dashboard from './components/Dashboard';
import ExpensesTab from './components/ExpensesTab';
import DebtsTab from './components/DebtsTab';
import SettingsTab from './components/SettingsTab';
import './styles/global.css';

const TABS = [
  { id: 'home', label: 'ホーム', icon: '⊕' },
  { id: 'expenses', label: '固定費', icon: '◆' },
  { id: 'debts', label: '借金', icon: '▽' },
  { id: 'settings', label: '設定', icon: '⚙' },
];

// 起動時のデータ: 新しい保存(v3) → 無ければ旧データ(v2)を変換（旧データは消さない） → 無ければ空
function initialState() {
  const v3 = load();
  if (v3) { save(v3); return v3; }   // 形が古ければ整えて保存し直す
  if (!IS_BETA) {
    const legacy = loadLegacy();
    if (legacy) { const m = ensureV3(legacy); save(m); return m; }
  }
  return INITIAL_DATA;
}

export default function App() {
  const [data, setData] = useState(initialState);
  const [tab, setTab] = useState('home');
  const [saved, setSaved] = useState(false);
  const [cloudOn, setCloudOn] = useState(false);

  // クラウド同期用
  const stateRef = useRef(data);
  useEffect(() => { stateRef.current = data; });
  const cloudCfg = useRef(IS_BETA ? null : loadCloud());
  const cloudReady = useRef(false);
  const lastPush = useRef(0);
  const firstCloud = useRef(true);

  // データが変わったらクラウドへ（有効なら・デバウンス）
  useEffect(() => {
    if (firstCloud.current) { firstCloud.current = false; return; }
    const c = cloudCfg.current;
    if (!cloudReady.current || !c || !c.code) return;
    const t = setTimeout(() => {
      cloudPush(c.code, data).then(ts => { lastPush.current = ts; }).catch(e => console.error('cloud push', e));
    }, 1200);
    return () => clearTimeout(t);
  }, [data]);

  // クラウド初期化（マウント時に1回）
  //   v3 の保存先があればそれを使う → 無ければ旧(v2)の保存先を読んで変換し、v3 の保存先に書く（旧はそのまま残す）
  useEffect(() => {
    const c = cloudCfg.current;
    if (!c || !c.config || !c.code) return;
    let cancelled = false;
    try { connectCloud(c.config); } catch (e) { console.error('cloud connect', e); return; }
    (async () => {
      try {
        let remote = await cloudPull(c.code);
        if (cancelled) return;
        if (!remote || !remote.state) {
          const legacy = await cloudPullLegacy(c.code);
          if (cancelled) return;
          if (legacy && legacy.state) remote = { state: ensureV3(legacy.state), updatedAt: 0 };
        }
        if (remote && remote.state) {
          const st = ensureV3(remote.state);
          setData(st); save(st);
          if (remote.updatedAt) lastPush.current = remote.updatedAt;
          else lastPush.current = await cloudPush(c.code, st);
        } else {
          lastPush.current = await cloudPush(c.code, stateRef.current);
        }
        cloudReady.current = true;
        setCloudOn(true);
        cloudSubscribe(c.code, ({ state: rs, updatedAt }) => {
          if (updatedAt > lastPush.current) { lastPush.current = updatedAt; const st = ensureV3(rs); setData(st); save(st); }
        });
      } catch (e) { console.error('cloud init', e); }
    })();
    return () => { cancelled = true; };
  }, []);

  const totals = calcTotals(data);

  const updateData = useCallback((updater) => {
    setData(prev => {
      const next = ensureV3(typeof updater === 'function' ? updater(prev) : updater);
      save(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      return next;
    });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-star">✦</span>
            <span className="logo-text">マネーログ{IS_BETA && <span className="badge badge-blue" style={{ marginLeft: 6 }}>ベータ</span>}</span>
          </div>
          <div className="header-right">
            {saved ? <span className="save-badge">保存済 ✓</span> : cloudOn && <span className="save-badge">☁ クラウド</span>}
            <div className="net-worth-mini">
              <span className="nw-label">借金の総額</span>
              <span className="nw-value neg">{fmt(totals.totalDebt)}</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === 'home' && <Dashboard data={data} totals={totals} go={setTab} />}
        {tab === 'expenses' && <ExpensesTab data={data} updateData={updateData} totals={totals} />}
        {tab === 'debts' && <DebtsTab data={data} updateData={updateData} totals={totals} />}
        {tab === 'settings' && <SettingsTab data={data} updateData={updateData} cloudOn={cloudOn} />}
      </main>
    </div>
  );
}
