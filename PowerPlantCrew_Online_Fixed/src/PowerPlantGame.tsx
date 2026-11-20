/** The original project's React <-> Phaser scene adapter, expanded with:
 * walkable rooms, original technician art, interactive stations and touch input.
 */
import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { MAP_WIDTH, MAP_HEIGHT, SPAWN, CONSOLES, USE_RADIUS, canTravel } from './plantMap';

export type GamePlayer = { id: string; name: string; x: number; y: number };
export type GameTask = { taskId: string; title: string; completed: boolean; completedBy: string };
type Props = {
  players: GamePlayer[];
  myId: string;
  onMove: (x: number, y: number) => void;
  tasks: GameTask[];
  started: boolean;
  onInteract: (taskId: string) => void;
};
const COLORS = ['amber', 'cyan', 'ruby', 'lime', 'violet', 'blue'];

/** Stable across computers; every client chooses the same suit for an identity. */
export function technicianColor(id: string) {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) hash = (hash * 33 + id.charCodeAt(i)) | 0;
  return COLORS[(hash >>> 0) % COLORS.length];
}

class PlantScene extends Phaser.Scene {
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private sprites = new Map<string, Phaser.GameObjects.Container>();
  private players: GamePlayer[] = [];
  private myId = '';
  private onMove: (x: number, y: number) => void = () => {};
  private onInteract: (taskId: string) => void = () => {};
  private tasks: GameTask[] = [];
  private started = false;
  private lastSend = 0;
  private localX = SPAWN.x;
  private localY = SPAWN.y;
  private initialized = false;
  private indicators = new Map<string, Phaser.GameObjects.Arc>();
  private touch = { up: false, down: false, left: false, right: false };
  private statusText!: Phaser.GameObjects.Text;

  constructor() { super('PlantScene'); }
  setPlayers(players: GamePlayer[], myId: string) { this.players = players; this.myId = myId; }
  setMoveHandler(handler: (x: number, y: number) => void) { this.onMove = handler; }
  setInteractHandler(handler: (id: string) => void) { this.onInteract = handler; }
  setTaskStatus(tasks: GameTask[], started: boolean) { this.tasks = tasks; this.started = started; }
  setTouch(direction: keyof typeof this.touch, held: boolean) { this.touch[direction] = held; }

  preload() {
    this.load.image('plant', '/assets/power-plant-map.png');
    for (const color of COLORS) this.load.image(`tech-${color}`, `/assets/technicians/${color}.png`);
  }

  create() {
    this.cameras.main.setBackgroundColor('#101728');
    this.add.image(0, 0, 'plant').setOrigin(0);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Painted map equipment is intentionally not Phaser physics colliders;
    // movement uses the same collision mask as the backend reducer.
    for (const c of CONSOLES) {
      const ring = this.add.circle(c.x, c.y, 21, 0x39f5df, .28)
        .setStrokeStyle(3, 0x75fce4).setDepth(25);
      ring.setInteractive({ useHandCursor: true });
      ring.on('pointerdown', () => this.tryInteract(c.id));
      this.indicators.set(c.id, ring);
      this.add.text(c.x, c.y - 39, c.room.toUpperCase(), {
        fontFamily: 'Arial', fontStyle: 'bold', fontSize: '14px',
        color: '#ffffff', backgroundColor: '#142137dd',
        padding: { x: 9, y: 5 },
      }).setOrigin(.5).setDepth(20);
      this.add.text(c.x, c.y, '✦', { fontSize: '22px', color: '#ffffff' })
        .setOrigin(.5).setDepth(27);
    }
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP, Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT, Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    ]);
    this.statusText = this.add.text(20, 20, '', {
      fontFamily: 'Arial', color: '#f8fafc', fontSize: '17px',
      backgroundColor: '#0b182bcc', padding: { x: 12, y: 9 },
    }).setScrollFactor(0).setDepth(100);
  }

  tryInteract(preferredId?: string) {
    if (!this.started) return;
    const options = CONSOLES.filter(c => Math.hypot(c.x - this.localX, c.y - this.localY) <= USE_RADIUS);
    const consoleAt = preferredId ? options.find(c => c.id === preferredId) : options[0];
    if (consoleAt && !this.tasks.some(t => t.taskId === consoleAt.id && t.completed)) {
      this.onInteract(consoleAt.id);
    }
  }

  update(time: number, delta: number) {
    const me = this.players.find(p => p.id === this.myId);
    if (me && !this.initialized) {
      this.localX = me.x; this.localY = me.y; this.initialized = true;
    }
    for (const p of this.players) {
      let sprite = this.sprites.get(p.id);
      if (!sprite) {
        const person = this.add.image(0, 0, `tech-${technicianColor(p.id)}`)
          .setDisplaySize(55, 70).setOrigin(.5, .78);
        const label = this.add.text(0, -64, p.name, {
          fontFamily: 'Arial', fontSize: '15px', color: '#ffffff',
          stroke: '#0b1725', strokeThickness: 4,
        }).setOrigin(.5);
        const halo = p.id === this.myId
          ? this.add.ellipse(0, 3, 44, 20, 0x39e4f0, .27).setStrokeStyle(2, 0x7fffe1)
          : this.add.ellipse(0, 3, 40, 16, 0x000000, .13);
        sprite = this.add.container(p.x, p.y, [halo, person, label]).setDepth(30);
        this.sprites.set(p.id, sprite);
        if (p.id === this.myId) this.cameras.main.startFollow(sprite, true, .1, .1);
      }
      if (p.id === this.myId) sprite.setPosition(this.localX, this.localY);
      else {
        sprite.x = Phaser.Math.Linear(sprite.x, p.x, .23);
        sprite.y = Phaser.Math.Linear(sprite.y, p.y, .23);
      }
    }
    for (const [id, sprite] of this.sprites) {
      if (!this.players.some(p => p.id === id)) { sprite.destroy(); this.sprites.delete(id); }
    }
    for (const c of CONSOLES) {
      const done = this.tasks.some(t => t.taskId === c.id && t.completed);
      const ring = this.indicators.get(c.id);
      if (ring) {
        ring.setFillStyle(done ? 0x28d88b : 0x58dfff, done ? .45 : (.25 + .09 * Math.sin(time / 300)));
        ring.setStrokeStyle(3, done ? 0x21d781 : 0x82ffef);
      }
    }
    const nearest = CONSOLES.find(c => Math.hypot(c.x - this.localX, c.y - this.localY) <= USE_RADIUS);
    this.statusText.setText(!this.started
      ? 'WAITING FOR HOST · Explore after shift starts'
      : nearest ? `E / USE · ${nearest.title}` : 'WASD / Arrows · Move   |   E · Use station');

    if (!me || !this.started) return;
    let dx = 0, dy = 0;
    if (this.keys.A.isDown || this.cursors.left.isDown || this.touch.left) dx--;
    if (this.keys.D.isDown || this.cursors.right.isDown || this.touch.right) dx++;
    if (this.keys.W.isDown || this.cursors.up.isDown || this.touch.up) dy--;
    if (this.keys.S.isDown || this.cursors.down.isDown || this.touch.down) dy++;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len; dy /= len;
      const step = 185 * Math.min(delta, 50) / 1000;
      const nx = this.localX + dx * step, ny = this.localY + dy * step;
      if (canTravel(this.localX, this.localY, nx, ny)) {
        this.localX = nx; this.localY = ny;
      } else if (canTravel(this.localX, this.localY, nx, this.localY)) {
        this.localX = nx;
      } else if (canTravel(this.localX, this.localY, this.localX, ny)) {
        this.localY = ny;
      }
    }
    // Send 10 updates per second while moving, and a final update when stopped.
    if (time - this.lastSend >= 100 && Math.hypot(this.localX - me.x, this.localY - me.y) > .8) {
      this.onMove(this.localX, this.localY); this.lastSend = time;
    }
    if (Math.hypot(this.localX - me.x, this.localY - me.y) > 90) {
      this.localX = me.x; this.localY = me.y;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.E) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.tryInteract();
    }
  }
}

export default function PowerPlantGame({ players, myId, onMove, tasks, started, onInteract }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const refs = useRef({ players, onMove, tasks, started, onInteract });
  refs.current = { players, onMove, tasks, started, onInteract };
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new PlantScene();
    scene.setPlayers(refs.current.players, myId);
    scene.setMoveHandler((x,y) => refs.current.onMove(x,y));
    scene.setInteractHandler(id => refs.current.onInteract(id));
    scene.setTaskStatus(refs.current.tasks, refs.current.started);
    const game = new Phaser.Game({
      type: Phaser.AUTO, width: 960, height: 640, parent: containerRef.current,
      backgroundColor: '#101728', scene,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    });
    gameRef.current = game;
    setSceneReady(true);
    return () => { gameRef.current = null; setSceneReady(false); game.destroy(true); };
  }, [myId]);
  useEffect(() => {
    const scene = gameRef.current?.scene.getScene('PlantScene') as PlantScene | undefined;
    scene?.setPlayers(players, myId);
    scene?.setTaskStatus(tasks, started);
  }, [players, myId, tasks, started, sceneReady]);
  const setTouch = (d: 'up'|'down'|'left'|'right', held: boolean) => {
    const scene = gameRef.current?.scene.getScene('PlantScene') as PlantScene | undefined;
    scene?.setTouch(d, held);
  };
  const touchButton = (d: 'up'|'down'|'left'|'right', label: string) => (
    <button className="move-touch" aria-label={`Move ${d}`}
      onPointerDown={e => { e.preventDefault(); setTouch(d,true); }}
      onPointerUp={() => setTouch(d,false)} onPointerLeave={() => setTouch(d,false)}
      onPointerCancel={() => setTouch(d,false)} onLostPointerCapture={() => setTouch(d,false)}>{label}</button>
  );
  return (
    <div className="game-frame">
      <div ref={containerRef} className="phaser-canvas" />
      <div className="touch-controls">
        <div className="dpad"><span/>{touchButton('up','▲')}<span/>
          {touchButton('left','◀')}{touchButton('down','▼')}{touchButton('right','▶')}</div>
        <button className="use-touch" onClick={() => {
          const scene = gameRef.current?.scene.getScene('PlantScene') as PlantScene | undefined;
          scene?.tryInteract();
        }}>USE</button>
      </div>
    </div>
  );
}
