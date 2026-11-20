import { useState } from 'react';
import { MINIGAMES, type MiniGameId } from './registry';

type Props = { id: MiniGameId; onClose: () => void; onComplete: (id: MiniGameId) => Promise<void> };
const monitorOrder = [1,3,0,2];
const gridOrder = [2,0,3,1];

export default function MiniGameModal({ id, onClose, onComplete }: Props) {
  const [rod, setRod] = useState(26);
  const [frequency, setFrequency] = useState(54);
  const [valves, setValves] = useState([false, true, false]);
  const [monitorProgress, setMonitorProgress] = useState(0);
  const [breakerProgress, setBreakerProgress] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [solved, setSolved] = useState(false);
  const info = MINIGAMES[id];

  async function submitSuccess() {
    if (saving || solved) return;
    setSaving(true);
    setError('');
    try {
      await onComplete(id);
      setSolved(true);
      onClose();
    } catch (err) { setError(String(err)); }
    finally { setSaving(false); }
  }
  function clickMonitor(index: number) {
    if (index !== monitorOrder[monitorProgress]) { setMonitorProgress(0); setError('Incorrect order — begin again.'); return; }
    setError('');
    const next = monitorProgress + 1;
    setMonitorProgress(next);
    if (next === 4) void submitSuccess();
  }
  function clickBreaker(index: number) {
    if (index !== gridOrder[breakerProgress]) { setBreakerProgress(0); setError('Breaker sequence reset.'); return; }
    setError('');
    const next = breakerProgress + 1;
    setBreakerProgress(next);
    if (next === 4) void submitSuccess();
  }
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="mini-modal" role="dialog" aria-modal="true" aria-label={info.name} onMouseDown={e => e.stopPropagation()}>
        <div className="mini-top"><span className="status-chip">MAINTENANCE TERMINAL</span>
          <button className="plain-close" onClick={onClose} aria-label="Close mini-game">✕</button></div>
        <h2>{info.name}</h2><p className="muted">{info.instructions}</p>
        {id === 'reactor' && <div className="mini-body">
          <div className="instrument"><span>ROD INSERTION</span><strong>{rod}%</strong><small>Target zone: 48–54%</small></div>
          <input className="range-control" type="range" min={0} max={100} value={rod} onChange={e => setRod(+e.target.value)}/>
          <div className="bar-track"><div className="bar-yellow" style={{width:`${rod}%`}}/></div>
          <button className="action" disabled={saving} onClick={() => Math.abs(rod-51)<=3 ? void submitSuccess() : setError('Outside the safe band. Set 48–54%.')}>Lock Rod Setting</button>
        </div>}
        {id === 'control' && <div className="mini-body"><p className="puzzle-note">Startup sequence: 2 → 4 → 1 → 3</p>
          <div className="instrument"><span>Panels rebooted</span><strong>{monitorProgress} / 4</strong></div>
          <div className="panel-grid">{[0,1,2,3].map(n => <button disabled={saving||solved} className="machine-button" key={n} onClick={() => clickMonitor(n)}>MONITOR {n+1}</button>)}</div>
        </div>}
        {id === 'cooling' && <div className="mini-body"><p className="puzzle-note">Inlet ON · Bypass OFF · Outlet ON</p>
          <div className="valve-row">{['INLET','BYPASS','OUTLET'].map((label,n)=><button key={label} className={'valve '+(valves[n]?'valve-open':'')} onClick={()=>setValves(old=>old.map((v,i)=>i===n?!v:v))}>{label}<strong>{valves[n]?'OPEN':'CLOSED'}</strong></button>)}</div>
          <button className="action" disabled={saving} onClick={()=>valves[0]&&!valves[1]&&valves[2]?void submitSuccess():setError('Valve flow configuration is not balanced.')}>Test Coolant Flow</button>
        </div>}
        {id === 'grid' && <div className="mini-body"><p className="puzzle-note">Restore breakers in order: C → A → D → B</p>
          <div className="instrument"><span>Breaker bank online</span><strong>{breakerProgress} / 4</strong></div>
          <div className="panel-grid">{['A','B','C','D'].map((v,n)=><button disabled={saving||solved} key={v} className="machine-button" onClick={()=>clickBreaker(n)}>BREAKER {v} <span>⚡</span></button>)}</div>
        </div>}
        {id === 'turbine' && <div className="mini-body"><div className="instrument"><span>GRID FREQUENCY</span><strong>{frequency.toFixed(1)} Hz</strong><small>Target: 60.0 Hz ± 0.4 Hz</small></div>
          <input className="range-control" type="range" min={50} max={70} step={0.1} value={frequency} onChange={e=>setFrequency(+e.target.value)}/>
          <button className="action" disabled={saving} onClick={()=>Math.abs(frequency-60)<=.4?void submitSuccess():setError('Frequency is not synchronized to the grid.')}>Connect Generator</button>
        </div>}
        {error&&<p className="error-text" role="alert">{error}</p>}
        {saving&&<p className="muted">Saving progress to the shared game…</p>}
        <p className="mini-disclaimer">Training simulation only — not equipment operating instructions.</p>
      </section>
    </div>
  );
}
