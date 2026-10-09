import React, { useState, useCallback, useEffect, useRef } from 'react';
import { INITIAL_DATA } from './data/initial';
import { calcTotals, fmt, save, load } from './utils/calc';
import { loadCloud, connectCloud, cloudPull, cloudPush, cloudSubscribe } from './utils/cloud';
import Dashboard from './components/Dashboard';
import AssetsTab from './components/AssetsTab';
import Debt1Tab from './components/Debt1Tab';
import Debt2Tab from './components/Debt2Tab';
import CFTab from './components/CFTab';
import SettingsTab from './components/SettingsTab';
import './styles/global.css';

const TABS = [
  { id: 'dashboard', label: 'ホーム', icon: '⊕' },
  { id: 'assets', label: '資産/収支', icon: '◆' },
  { id: 'debt1', label: '借金①', icon: '▽' },
  { id: 'debt2', label: '借金Ⅱ7月', icon: '◉' },
  { id: 'unpaid', label: '未払い', icon: '△' },
  { id: 'cf', label: 'CF', icon: '≋' },
  { id: 'settings', label: '設定', icon: '⚙' },
];

export default function App() {
  const [data, setData] = useState(() => load() || INITIAL_DATA);
  const [tab, setTab] = useState('dashboard');
  const [saved, setSaved] = useState(false);
  const [cloudOn, setCloudOn] = useState(false);

  // クラウド同期用
  const stateRef = useRef(data);
  useEffect(() => { stateRef.current = data; });
  const cloudCfg = useRef(loadCloud());
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
  useEffect(() => {
    const c = cloudCfg.current;
    if (!c || !c.config || !c.code) return;
    let cancelled = false;
    try { connectCloud(c.config); } catch (e) { console.error('cloud connect', e); return; }
    (async () => {
      try {
        const remote = await cloudPull(c.code);
        if (cancelled) return;
        if (remote && remote.state) { setData(remote.state); save(remote.state); lastPush.current = remote.updatedAt; }
        else { const ts = await cloudPush(c.code, stateRef.current); lastPush.current = ts; }
        cloudReady.current = true;
        setCloudOn(true);
        cloudSubscribe(c.code, ({ state: rs, updatedAt }) => {
          if (updatedAt > lastPush.current) { lastPush.current = updatedAt; setData(rs); save(rs); }
        });
      } catch (e) { console.error('cloud init', e); }
    })();
    return () => { cancelled = true; };
  }, []);

  const totals = calcTotals(data);

  const updateData = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
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
            <span className="logo-text">マネーログ</span>
          </div>
          <div className="header-right">
            {saved ? <span className="save-badge">保存済 ✓</span> : cloudOn && <span className="save-badge">☁ クラウド</span>}
            <div className="net-worth-mini">
              <span className="nw-label">純資産</span>
              <span className={`nw-value ${totals.netWorth >= 0 ? 'pos' : 'neg'}`}>{fmt(totals.netWorth)}</span>
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
        {tab === 'dashboard' && <Dashboard data={data} totals={totals} />}
        {tab === 'assets' && <AssetsTab data={data} updateData={updateData} totals={totals} />}
        {tab === 'debt1' && <Debt1Tab data={data} updateData={updateData} totals={totals} />}
        {tab === 'debt2' && <Debt2Tab data={data} updateData={updateData} totals={totals} mode="debt2" />}
        {tab === 'unpaid' && <Debt2Tab data={data} updateData={updateData} totals={totals} mode="unpaid" />}
        {tab === 'cf' && <CFTab data={data} totals={totals} />}
        {tab === 'settings' && <SettingsTab data={data} updateData={updateData} cloudOn={cloudOn} />}
      </main>
    </div>
  );
}
