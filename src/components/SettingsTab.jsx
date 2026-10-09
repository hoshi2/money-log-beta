import React, { useRef, useState } from 'react';
import { loadCloud, saveCloud, clearCloud, parseConfig } from '../utils/cloud';

export default function SettingsTab({ data, updateData, cloudOn }) {
  const fileRef = useRef(null);
  const existingCloud = loadCloud();
  const [cfgText, setCfgText] = useState('');
  const [syncCode, setSyncCode] = useState(existingCloud?.code || '');
  const [msg, setMsg] = useState('');

  function connect() {
    let config;
    try { config = parseConfig(cfgText); } catch (e) { alert('Firebaseの設定が読み取れません：' + e.message); return; }
    const code = (syncCode || '').trim();
    if (code.length < 4) { alert('同期コードは4文字以上にしてください（自分だけの合言葉）'); return; }
    saveCloud({ config, code });
    alert('クラウド保存をオンにしました。読み込み直します。');
    window.location.reload();
  }
  function disconnect() {
    if (!window.confirm('クラウド保存を解除する？\n（この端末のデータは残ります。クラウド上のデータも消えません）')) return;
    clearCloud();
    window.location.reload();
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stella-finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('バックアップを書き出した');
    setTimeout(() => setMsg(''), 2500);
  }
  function importData(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        updateData(() => d);
        setMsg('復元した');
      } catch { setMsg('読み込み失敗：ファイルを確認して'); }
      setTimeout(() => setMsg(''), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div style={{ padding: '4px 0 24px' }}>
      <div className="section-label">クラウド自動保存（消えない保存）</div>

      {cloudOn || existingCloud ? (
        <div className="card">
          <div style={{ color: 'var(--green)', fontWeight: 700, marginBottom: 6 }}>☁ クラウド保存オン</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
            同期コード：<b>{existingCloud?.code}</b><br />
            入力するたびに自動でクラウドに保存。別の端末でも同じコードを入れれば同じデータになります。
          </div>
          <button className="btn btn-ghost btn-full" onClick={disconnect}>クラウド保存を解除する</button>
        </div>
      ) : (
        <>
          <div className="card">
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
              スマホのデータ消去や機種変でも消えないように、無料のFirebaseに自動保存できます。<b>最初の1回だけ設定</b>が必要です（手順は下）。
            </div>
            <div className="input-group">
              <label className="input-label">① Firebaseの設定を貼り付け</label>
              <textarea className="input-field" style={{ minHeight: 90, fontFamily: 'monospace', fontSize: 11 }}
                placeholder={'const firebaseConfig = { apiKey: "...", projectId: "...", ... }'}
                value={cfgText} onChange={e => setCfgText(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">② 同期コード（自分だけの合言葉・4文字以上）</label>
              <input className="input-field" value={syncCode} placeholder="例：stella-1207"
                onChange={e => setSyncCode(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-full" onClick={connect}>クラウド保存をオンにする</button>
          </div>
          <div className="card" style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.9 }}>
            <b>設定のやり方（5分）</b><br />
            1. <b>console.firebase.google.com</b> で無料プロジェクトを作成<br />
            2. 「Firestore Database」を作成（テストモードでOK）<br />
            3. ⚙️プロジェクト設定 →「マイアプリ」でWebアプリ（&lt;/&gt;）を追加<br />
            4. 出てくる <b>firebaseConfig</b> をコピーして上の①に貼り付け<br />
            分からなければ、この画面のスクショを送ってくれれば一緒に進めます。
          </div>
        </>
      )}

      <div className="section-label" style={{ marginTop: 20 }}>バックアップ（ファイル）</div>
      <div className="card">
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
          クラウドを使わない場合、この「書き出し」ファイルを保存しておけば復元できます。
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn btn-primary btn-full" onClick={exportData}>バックアップを書き出す</button>
          <button className="btn btn-ghost btn-full" onClick={() => fileRef.current?.click()}>バックアップから復元する</button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importData} />
        </div>
        {msg && <div style={{ marginTop: 8, color: 'var(--blue)', fontSize: 13 }}>{msg}</div>}
      </div>
    </div>
  );
}
