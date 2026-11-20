/** Multiplayer lobby / crew HUD. Retains the uploaded project's React/SpacetimeDB
 * hooks and QR-code design, but moves tasks and shift state into server tables. */
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSpacetimeDB, useTable, useReducer } from 'spacetimedb/react';
import { tables, reducers } from './module_bindings';
import PowerPlantGame, { technicianColor, type GamePlayer, type GameTask } from './PowerPlantGame';
import MiniGameModal from './minigames/MiniGameModal';
import { MINIGAMES, type MiniGameId, TASK_COUNT } from './minigames/registry';
import { makeLobbyInvite } from './invite';
import './style.css';

const params = new URLSearchParams(window.location.search);
function createLobbyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

export default function App() {
  const { isActive: connected, identity } = useSpacetimeDB();
  const [rooms] = useTable(tables.gameRoom);
  const [players] = useTable(tables.player);
  const [states] = useTable(tables.plantState);
  const [allTasks] = useTable(tables.plantTask);
  const createRoom = useReducer(reducers.createRoom);
  const joinRoom = useReducer(reducers.joinRoom);
  const leaveRoom = useReducer(reducers.leaveRoom);
  const movePlayer = useReducer(reducers.movePlayer);
  const startShift = useReducer(reducers.startShift);
  const finishTask = useReducer(reducers.finishTask);
  const [name, setName] = useState(() => localStorage.getItem('powerplant-technician-name') ?? '');
  const [code, setCode] = useState(() => (params.get('room') ?? '').toUpperCase());
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState('');
  useEffect(() => {
    const listener = (event: Event) => setConnectionError((event as CustomEvent<string>).detail);
    window.addEventListener('powerplant-connection-error', listener);
    return () => window.removeEventListener('powerplant-connection-error', listener);
  }, []);
  useEffect(() => { if (connected) setConnectionError(''); }, [connected]);
  const [busy, setBusy] = useState(false);
  const [showInvite, setShowInvite] = useState(true);
  const [activeMiniGame, setActiveMiniGame] = useState<MiniGameId | null>(null);

  const myId = identity?.toHexString() ?? '';
  const me = players.find(p => p.identity.toHexString() === myId);
  const roomCode = me?.roomCode ?? '';
  const room = rooms.find(r => r.code === roomCode);
  const state = states.find(s => s.roomCode === roomCode);
  const started = state?.started ?? false;
  const isHost = Boolean(room && myId && room.host.toHexString() === myId);
  const members: GamePlayer[] = roomCode
    ? players.filter(p => p.roomCode === roomCode).map(p => ({
        id: p.identity.toHexString(), name: p.name, x: p.x, y: p.y,
      })) : [];
  const tasks: GameTask[] = allTasks.filter(t => t.roomCode === roomCode && !!roomCode)
    .map(t => ({ taskId: t.taskId, title: t.title, completed: t.completed, completedBy: t.completedBy }));
  const completed = tasks.filter(t => t.completed).length;
  const invite = roomCode ? makeLobbyInvite(
    roomCode,
    window.location.origin,
    import.meta.env.VITE_PUBLIC_SITE_URL,
  ) : { url: '', publicHttps: false, notice: '' };
  const inviteUrl = invite.url;

  function rememberName() { localStorage.setItem('powerplant-technician-name', name.trim()); }
  async function withError(task: () => Promise<void>) {
    setError(''); setBusy(true);
    try { await task(); } catch (err) { setError(String(err)); }
    finally { setBusy(false); }
  }
  function create() {
    if (!name.trim()) { setError('Enter a technician name first.'); return; }
    rememberName();
    void withError(async () => { const next = createLobbyCode(); await createRoom({ code: next, name: name.trim() }); setCode(next); });
  }
  function join() {
    if (!name.trim()) { setError('Enter a technician name first.'); return; }
    const formatted = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(formatted)) { setError('Enter a six-character lobby code.'); return; }
    rememberName();
    void withError(async () => { await joinRoom({ code: formatted, name: name.trim() }); setCode(formatted); });
  }
  function leave() {
    void withError(async () => { await leaveRoom(); setActiveMiniGame(null); });
  }
  async function completeTask(id: MiniGameId) {
    await finishTask({ taskId: id });
    setActiveMiniGame(null);
  }
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="brand"><div className="brand-symbol">⚡</div><div>
          <span className="eyebrow">MULTIPLAYER MAINTENANCE SIMULATOR</span>
          <h1>POWER PLANT <span>CREW</span></h1>
        </div></div>
        <div className={'connection-pill '+(connected?'online':'offline')}>
          <span className="connection-light" />{connected?'SPACETIMEDB CONNECTED':'CONNECTING TO SPACETIMEDB'}
        </div>
      </header>
      {!me ? <main className="welcome-grid">
        <section className="welcome-art">
          <img src="/assets/power-plant-map.png" alt="Five-room cartoon power plant map" />
          <div className="welcome-art-copy"><span className="status-chip">FIVE-ROOM POWER PLANT</span>
            <h2>Keep the plant running.</h2><p>Team up as technicians, move through the station, and complete hands-on maintenance mini-games.</p></div>
        </section>
        <section className="join-panel">
          <span className="eyebrow">CREW STATION</span><h2>Enter the plant</h2>
          <p className="muted">Create a lobby or scan a teammate's QR invite. Up to 12 technicians per room.</p>
          <label htmlFor="technicianName">Technician name</label>
          <input id="technicianName" maxLength={24} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Tech 01" onKeyDown={e=>e.key==='Enter'&&join()} />
          <button className="action" disabled={!connected||busy} onClick={create}>+ Create New Lobby</button>
          <div className="or-divider"><span>OR JOIN A CREW</span></div>
          <label htmlFor="roomCode">Six-character room code</label>
          <input id="roomCode" maxLength={6} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="ABC123" onKeyDown={e=>e.key==='Enter'&&join()} className="code-input" />
          <button className="action secondary" disabled={!connected||busy} onClick={join}>Join Existing Lobby</button>
          {error&&<p className="error-text" role="alert">{error}</p>}
          {connectionError&&!connected&&<p className="error-text" role="alert">{connectionError}</p>}
          {!connected&&<p className="muted small">Database: {import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? 'powerplantnov'} · Host: {import.meta.env.VITE_SPACETIMEDB_HOST ?? 'https://maincloud.spacetimedb.com'}</p>}
          <div className="join-help">🖥 Desktop: WASD / arrow keys · E to interact<br/>📱 Phone: touch controls and USE button</div>
        </section>
      </main> : <main className="play-layout">
        <aside className="sidebar">
          <div className="section-label">PLANT OPERATIONS</div>
          <div className="lobby-code"><div><span className="muted small">LOBBY CODE</span><strong>{roomCode}</strong></div>
            <button className="icon-button" onClick={()=>setShowInvite(v=>!v)} title="Show or hide invite">⌗</button></div>
          <div className="panel">
            <div className="panel-heading"><h2>Shift Status</h2><span className={started?'status-chip started':'status-chip'}>{started?'ACTIVE':'LOBBY'}</span></div>
            <div className="progress-summary"><strong>{completed} / {TASK_COUNT}</strong><span>STATIONS SERVICED</span></div>
            <div className="progress-track"><div style={{width:`${completed/TASK_COUNT*100}%`}}/></div>
            {started&&completed===TASK_COUNT?<p className="victory">✓ PLANT RESTORED — shift completed!</p>
            :<p className="muted small">{started?'Repair all five stations to restore full operation.':'Waiting for the host to begin the shift.'}</p>}
          </div>
          <div className="panel">
            <div className="panel-heading"><h2>Task List</h2><span className="muted small">{TASK_COUNT} ROOMS</span></div>
            {Object.entries(MINIGAMES).map(([taskId,info])=>{
              const task=tasks.find(t=>t.taskId===taskId);
              return <div key={taskId} className={'task-item '+(task?.completed?'task-done':'')}>
                <span className="task-bullet">{task?.completed?'✓':'!'}</span>
                <div><strong>{info.name}</strong><small>{info.room}{task?.completed?` · ${task.completedBy}`:''}</small></div>
              </div>;
            })}
          </div>
          <div className="panel">
            <div className="panel-heading"><h2>Crew ({members.length}/12)</h2></div>
            {members.map(p=><div className="crew-member" key={p.id}>
              <img src={`/assets/technicians/${technicianColor(p.id)}.png`} alt="" />
              <span>{p.name}{p.id===myId?' (you)':''}</span>{room?.host.toHexString()===p.id&&<small>HOST</small>}
            </div>)}
          </div>
          <button className="leave-button" onClick={leave} disabled={busy}>Leave Lobby</button>
        </aside>
        <div className="game-main">
          <div className="game-toolbar">
            <div><span className="eyebrow">STATION MAP · LIVE MULTIPLAYER</span><h2>{started?'Maintenance Shift':'Crew Assembly'}</h2></div>
            <div className="toolbar-actions">
              <button className="minor-button" onClick={()=>setShowInvite(s=>!s)}>⌗ Invite Players</button>
              {isHost&&!started&&<button className="action" disabled={busy} onClick={()=>void withError(async()=>{await startShift({code:roomCode});})}>▶ Start Shift</button>}
            </div>
          </div>
          {!started&&<p className="waiting-line">{isHost?'You are host. Invite teammates, then press Start Shift.':'Host will start the shift when everyone is ready.'}</p>}
          <PowerPlantGame players={members} myId={myId} tasks={tasks} started={started}
            onMove={(x,y)=>{ if(connected) void movePlayer({x,y}).catch(()=>{}); }}
            onInteract={id=>{
              if (id in MINIGAMES && !tasks.some(t=>t.taskId===id&&t.completed))
                setActiveMiniGame(id as MiniGameId);
            }}/>
          <div className="game-footer"> <span>WASD / ARROW KEYS: MOVE</span> <span>E / SPACE / USE: REPAIR</span> <span>CLICK GLOWING STATIONS TO INTERACT</span></div>
          {error&&<p className="error-text" role="alert">{error}</p>}
          {showInvite&&<section className="invite-card">
            <div><h3>Invite your crew</h3><p className="muted small">Scan with a phone or enter <strong>{roomCode}</strong> on the game website.</p>
              <input readOnly value={inviteUrl} aria-label="Invite URL" />
              <div className="invite-actions"><button className="minor-button" disabled={!invite.publicHttps} onClick={()=>void navigator.clipboard.writeText(inviteUrl).catch(e=>setError(String(e)))}>Copy Public Invite</button><button className="text-button" onClick={()=>setShowInvite(false)}>Hide</button></div>
              {!invite.publicHttps&&<p className="qr-warning" role="status">{invite.notice}</p>}
            </div>
            <div className="qr-background">{invite.publicHttps ?
              <QRCodeSVG value={inviteUrl} size={154} level="M" includeMargin /> :
              <div className="qr-placeholder" aria-label="QR code available after HTTPS deployment">HTTPS<br/>SITE<br/>NEEDED</div>}</div>
          </section>}
        </div>
      </main>}
      {activeMiniGame && <MiniGameModal key={activeMiniGame} id={activeMiniGame}
        onClose={()=>setActiveMiniGame(null)} onComplete={completeTask}/>}
      <footer className="site-footer">POWER PLANT CREW · Original technician artwork · Classroom training simulation · SpacetimeDB multiplayer</footer>
    </div>
  );
}
