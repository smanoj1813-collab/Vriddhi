import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { buildScene, fitTransform, makeView, PITCH_FROM_YAW, type LearningTime, type Scene } from './campusScene';
import './campus3d.css';

/**
 * The landing/sign-in hero: a hand-built 3D campus drawn as SVG.
 *
 * Cost: zero. There is no three.js, no WebGL context, no CDN font or texture, no
 * runtime network request and no paid rendering service — the geometry is code
 * that ships with the bundle, so the marginal hosting cost of this animation is
 * a few kB of JS/CSS. Everything runs on the client's own GPU via CSS
 * transforms and plain SVG paths.
 *
 * Feel: the scene is rendered *live* while you drag it. Projection, lighting,
 * depth tinting and far-to-near sorting are all pure functions (see campusScene.ts),
 * so each pointer move is a cheap, deterministic rebuild rather than a
 * pre-baked animation. A slow idle drift keeps it gently alive, and it stops
 * the moment the user interacts, leaves reduced-motion on, or the tab hides.
 *
 * Accessibility: the drawing is aria-hidden (the headline carries the meaning).
 * Keyboard and screen-reader users get the same sense of depth from the
 * labelled rotation controls in the footer of the card.
 */

const IDLE_SPEED = 0.055; // radians per second — barely perceptible drift
const IDLE_RANGE = 0.34; // how far the drift wanders from the starting angle
const DRAG_SENSITIVITY = 0.0075; // radians per pixel dragged
const MAX_YAW = 1.05;
const REST_YAW = -0.5;
const DRIFT_CENTRE = -0.42;
const VIEWBOX = { width: 1000, height: 660 };

type Phase = 'arriving' | 'idle' | 'manual';

/**
 * Repaints the geometry in place for one camera angle.
 *
 * This applies the same projection the React tree renders (buildScene) to the
 * nodes React already mounted. Faces are addressed by a *stable id* built from
 * shapeId + faceIndex, never by document order: buildScene sorts solids
 * far-to-near, and that order changes as the model turns. Painting by position
 * would smear one building's colour onto another mid-rotation.
 */
/**
 * The visitor's local hour, re-read on a slow timer so a page left open crosses
 * dusk by itself. Reading `Date` here rather than inside the engine keeps
 * `buildScene` pure; without `showTime` the campus keeps its daylight pattern.
 */
/** Reads the clock as a fractional hour, so the tower hand tracks the minutes. */
function readLocalHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

function useLocalTime(enabled: boolean): LearningTime | undefined {
  const [hour, setHour] = useState<number | undefined>(() => (enabled ? readLocalHour() : undefined));
  useEffect(() => {
    if (!enabled) { setHour(undefined); return; }
    setHour(readLocalHour());
    // Whole hours were too coarse: the hand moved in twelve steps and ignored
    // the minutes, so changing the clock by a few minutes changed nothing. A
    // minute tick keeps it honest; the state is a single number, and the scene
    // only rebuilds when it actually differs.
    const timer = setInterval(() => {
      const next = readLocalHour();
      // Stored rounded to the minute: a sub-minute change would repaint the
      // whole scene for movement nobody can see.
      setHour((previous) => (previous !== undefined && Math.floor(previous * 60) === Math.floor(next * 60) ? previous : next));
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [enabled]);
  return hour === undefined ? undefined : { hour };
}

function paintScene(group: SVGGElement | null, yaw: number, time?: LearningTime) {
  if (!group) return;
  const scene = buildScene(makeView(yaw, PITCH_FROM_YAW + yaw * 0.02), time);
  const paint = (key: string, face: { points: [number, number][]; fill: string; stroke?: string }) => {
    const node = group.querySelector<SVGPolygonElement>(`polygon[data-face="${key}"]`);
    if (!node) return;
    node.setAttribute('points', face.points.map((point) => point.join(',')).join(' '));
    node.setAttribute('fill', face.fill);
    node.setAttribute('stroke', face.stroke ?? face.fill);
  };
  scene.ground.forEach((face, index) => paint(`ground-${index}`, face));
  for (const solid of scene.solids) {
    solid.faces.forEach((face, index) => paint(`${solid.id}-${index}`, face));
  }
  // Reorder the mounted solids to the new far-to-near sequence so overlaps stay
  // correct, using the same depth buildScene just computed.
  for (const solid of scene.solids) {
    const node = group.querySelector(`[data-solid="${solid.id}"]`);
    if (node) group.appendChild(node);
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Tracks the reduced-motion setting for the life of the component, so toggling
 * the OS/browser preference takes effect immediately instead of on next reload.
 */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    // Safari < 14 only has the deprecated listener API.
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }
    query.addListener?.(onChange);
    return () => query.removeListener?.(onChange);
  }, []);
  return reduced;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function Campus3D({
  className = '',
  showControls = true,
  autoDrift = true,
  showTime = true,
}: {
  className?: string;
  /**
   * Renders the rotation buttons and puts the stage in the tab order. Turn this
   * off wherever the illustration sits beside a task the visitor came to
   * complete (the sign-in shell): five extra tab stops ahead of the email field
   * is a real cost, while dragging still works for anyone using a pointer.
   */
  showControls?: boolean;
  autoDrift?: boolean;
  /**
   * Lights the windows and sets the tower hand from the visitor's local clock.
   * Off by default? No: it is the cheapest part of the illustration (recolouring
   * faces the drift already repaints), so it is on wherever the rest is.
   */
  showTime?: boolean;
}) {
  const [yaw, setYaw] = useState(REST_YAW);
  const [phase, setPhase] = useState<Phase>('arriving');
  const [dragging, setDragging] = useState(false);
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const time = useLocalTime(showTime);
  // The drift loop must not resubscribe every ten-minute tick, so hand it the
  // latest clock reading through a ref. `useMemo` above still repaints the tree.
  const timeRef = useRef(time);
  timeRef.current = time;
  const frame = useRef<number | null>(null);
  const lastTime = useRef<number | null>(null);
  // The idle drift repaints straight into the DOM instead of going through
  // React state: 474 polygons re-reconciled every frame is measurable jank on a
  // budget phone, while patching ~950 attributes imperatively is not. State
  // stays the source of truth for every deliberate interaction (drag, keys,
  // buttons), which then settle back into this same node reference.
  const sceneGroupRef = useRef<SVGGElement | null>(null);
  // The entrance tween owns the angle until it lands. A real browser can stall
  // its rAF chain (a throttled background tab, a long layout); if that happened
  // it would keep overwriting whatever the user did. Any deliberate interaction
  // cancels it instead, so input always wins.
  const entranceFrame = useRef<number | null>(null);
  // The authoritative camera angle. React state mirrors it so the declarative
  // tree re-renders after every deliberate interaction; the drift mutates this
  // ref only, so a cleanup can never hand a stale angle back to React and undo
  // a keypress or a drag.
  const yawRef = useRef(REST_YAW);
  const dragged = useRef(false);
  const startYaw = useRef(-0.5);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerStart = useRef<{ x: number; y: number; yaw: number } | null>(null);

  /** The one way to move the camera: records it for the ref, mirrors it to state. */
  const moveTo = useCallback((next: number) => {
    const clamped = clamp(next, -MAX_YAW, MAX_YAW);
    yawRef.current = clamped;
    setYaw(clamped);
  }, []);

  /** A deliberate move: stop the entrance tween, then take the camera. */
  const takeOver = useCallback((next: number) => {
    if (entranceFrame.current !== null) {
      cancelAnimationFrame(entranceFrame.current);
      entranceFrame.current = null;
    }
    setPhase('manual');
    moveTo(next);
  }, [moveTo]);

  const scene: Scene = useMemo(
    () => buildScene(makeView(yaw, PITCH_FROM_YAW + yaw * 0.02), time),
    // Rebuilding on the hour is the point: the windows recolor and the tower
    // hand moves. `time` only changes on the ten-minute tick.
    [yaw, time],
  );
  // One fixed fit for every reachable angle (see fitTransform): the model never
  // zooms mid-drag, and nothing clips at the extremes.
  const fit = useMemo(
    () => fitTransform([-MAX_YAW, REST_YAW, -0.2, 0.4, MAX_YAW], VIEWBOX, 28),
    [],
  );

  // Entrance: arrive from slightly wide, settle to the composed angle.
  useEffect(() => {
    if (reducedMotion) {
      moveTo(REST_YAW);
      setPhase('idle');
      return;
    }
    const from = -0.86;
    const to = REST_YAW;
    const duration = 1250;
    const started = performance.now();
    moveTo(from);
    const tick = (now: number) => {
      const t = clamp((now - started) / duration, 0, 1);
      // ease-out-expo: fast off the mark, long graceful settle
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -9 * t);
      moveTo(from + (to - from) * eased);
      if (t < 1) entranceFrame.current = requestAnimationFrame(tick);
      else {
        entranceFrame.current = null;
        setPhase('idle');
      }
    };
    entranceFrame.current = requestAnimationFrame(tick);
    return () => {
      if (entranceFrame.current !== null) cancelAnimationFrame(entranceFrame.current);
      entranceFrame.current = null;
    };
    // Runs once: the entrance is an arrival, not a reaction to state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // Pause the drift while the tab is hidden or the hero is scrolled away.
  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    let observer: IntersectionObserver | null = null;
    if (containerRef.current && typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
        else if (!dragging) setVisible(false);
      }, { rootMargin: '120px' });
      observer.observe(containerRef.current);
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      observer?.disconnect();
    };
  }, [dragging]);

  // The idle drift. Deliberately a slow, bounded sway rather than a spin: it
  // suggests a living model without making text unreadable beside it.
  useEffect(() => {
    if (!autoDrift || phase !== 'idle' || reducedMotion || dragging || !visible) return;
    const centre = DRIFT_CENTRE;
    // Phase the sway from mount, not from the absolute clock. `performance.now()`
    // is time since navigation start, so keying the sine off it made the drift
    // depend on *when* the page was loaded: a visitor who arrived near a zero
    // crossing saw the campus sit almost still for a second or two, and the
    // behaviour was not reproducible between runs.
    const origin = performance.now();
    const tick = (now: number) => {
      const previous = lastTime.current ?? now;
      // Clamp the step so a backgrounded tab resuming does not jump the model.
      const delta = Math.min(now - previous, 64) / 1000;
      lastTime.current = now;
      const current = yawRef.current;
      const next = clamp(
        current + Math.sin((now - origin) / 2600) * IDLE_SPEED * delta + (centre - current) * 0.004,
        centre - IDLE_RANGE,
        centre + IDLE_RANGE,
      );
      yawRef.current = next;
      paintScene(sceneGroupRef.current, next, timeRef.current);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      lastTime.current = null;
    };
  }, [autoDrift, phase, reducedMotion, dragging, visible]);

  const endDrag = useCallback(() => {
    setDragging(false);
    pointerStart.current = null;
    setPhase('idle');
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    // Stop the arrival tween so it cannot fight the drag.
    if (entranceFrame.current !== null) {
      cancelAnimationFrame(entranceFrame.current);
      entranceFrame.current = null;
      setPhase('manual');
    }
    dragged.current = false;
    startYaw.current = yawRef.current;
    pointerStart.current = { x: event.clientX, y: event.clientY, yaw: yawRef.current };
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > 3) dragged.current = true;
    takeOver(start.yaw + dx * DRAG_SENSITIVITY);
  }, [takeOver]);

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    endDrag();
  }, [endDrag]);

  // Keyboard parity: the whole stage is a slider, arrow keys rotate the model.
  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.22 : 0.1;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      takeOver(yawRef.current + (event.key === 'ArrowRight' ? step : -step));
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      takeOver(event.key === 'Home' ? -MAX_YAW : MAX_YAW);
    }
  }, [takeOver]);

  const nudge = useCallback((delta: number) => takeOver(yawRef.current + delta), [takeOver]);

  const reset = useCallback(() => {
    takeOver(REST_YAW);
    setPhase('idle');
  }, [takeOver]);

  const yawPercent = Math.round(((yaw + MAX_YAW) / (MAX_YAW * 2)) * 100);

  return (
    <div
      ref={containerRef}
      className={`campus3d${dragging ? ' is-dragging' : ''}${phase === 'arriving' ? ' is-arriving' : ''}${className ? ` ${className}` : ''}`}
    >
      <div
        className="campus3d-stage"
        role="group"
        aria-label={
          showControls
            ? 'Interactive 3D illustration of a connected college campus. Drag, or use the rotation buttons, to look around.'
            : '3D illustration of a connected college campus, which can be dragged to look around.'
        }
        tabIndex={showControls ? 0 : -1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <svg
          className="campus3d-svg"
          viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
          role="img"
          aria-label="An illustrated three-dimensional college campus with a central academic block, two wings, trees, lamps, people and floating notice cards."
          focusable="false"
        >
          <defs>
            <linearGradient id="campus3d-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F5FAF0" />
              <stop offset="0.46" stopColor="#EFF6E6" />
              <stop offset="0.72" stopColor="#E9F2DF" />
              <stop offset="1" stopColor="#E3EEDA" />
            </linearGradient>
            <radialGradient id="campus3d-vignette" cx="50%" cy="46%" r="72%">
              <stop offset="0.58" stopColor="#BBD3BE" stopOpacity="0" />
              <stop offset="1" stopColor="#8FAE97" stopOpacity="0.28" />
            </radialGradient>
          </defs>
          <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#campus3d-sky)" />
          <ellipse cx={VIEWBOX.width * 0.52} cy={VIEWBOX.height * 0.74} rx={VIEWBOX.width * 0.42} ry={VIEWBOX.height * 0.2} fill="#DCEBCF" opacity="0.55" />

          {/* Sky: behind everything, and never drawn over the building. */}
          <Sun scene={scene} />
          <g className="campus3d-clouds">
            {scene.billboards.filter((item) => item.art === 'cloud').map((cloud) => (
              <g key={cloud.id} transform={`translate(${cloud.anchor[0]} ${cloud.anchor[1]}) scale(${(cloud.scale * 46).toFixed(2)})`}>
                <path d="M-1 0.05C-1.2-0.3-0.6-0.55-0.15-0.4C0-0.85 0.75-0.9 0.95-0.45C1.5-0.6 1.9-0.2 1.6 0.1Z" fill="#FFFFFF" opacity="0.92" />
              </g>
            ))}
          </g>

          <g ref={sceneGroupRef} transform={`translate(${fit.translateX.toFixed(2)} ${fit.translateY.toFixed(2)}) scale(${fit.scale.toFixed(4)})`}>
            {scene.ground.map((face, index) => (
              <polygon
                key={`ground-${index}`}
                data-face={`ground-${index}`}
                points={face.points.map((point) => point.join(',')).join(' ')}
                fill={face.fill}
                stroke={face.stroke ?? 'none'}
              />
            ))}
            {scene.links.map((link) => (
              <path
                key={link.id}
                className="campus3d-link"
                d={`M${link.from[0]} ${link.from[1]}Q${(link.from[0] + link.to[0]) / 2} ${Math.min(link.from[1], link.to[1]) - 46} ${link.to[0]} ${link.to[1]}`}
                fill="none"
                stroke="#8CB6A0"
                strokeWidth={1.5}
                strokeDasharray="5 8"
                strokeLinecap="round"
              />
            ))}
            {scene.solids.map((solid) => (
              <g key={solid.id} className="campus3d-solid" data-group={solid.group} data-solid={solid.id}>
                {solid.faces.map((face, index) => (
                  <polygon
                    key={`${solid.id}-${index}`}
                    data-face={`${solid.id}-${index}`}
                    points={face.points.map((point) => point.join(',')).join(' ')}
                    fill={face.fill}
                    stroke={face.stroke ?? face.fill}
                    strokeWidth={face.stroke ? 1.1 : 0.35}
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            ))}
            {/* People stand in the plaza, scaled by their own depth. */}
            {scene.billboards.filter((item) => item.art.startsWith('student')).map((student) => (
              <g key={student.id} transform={`translate(${student.anchor[0]} ${student.anchor[1]}) scale(${(student.scale * 55).toFixed(2)})`}>
                <Student alt={student.art === 'student-alt'} />
              </g>
            ))}
          </g>

          <g className="campus3d-sparks">
            {[[132, 214], [862, 264], [922, 452], [86, 470]].map(([x, y], index) => (
              <path
                key={`spark-${index}`}
                d={`M${x} ${y - 11}V${y + 11}M${x - 11} ${y}H${x + 11}`}
                stroke="#DFB262"
                strokeWidth={3.2}
                strokeLinecap="round"
                style={{ animationDelay: `${index * 0.35}s` }}
              />
            ))}
          </g>
          <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#campus3d-vignette)" pointerEvents="none" />
        </svg>
      </div>

      {showControls && (
        <div className="campus3d-controls">
          <div className="campus3d-hint">
            <Sparkles size={14} aria-hidden="true" />
            <span>{dragging ? 'Looking around…' : 'Drag to look around'}</span>
          </div>
          <div className="campus3d-buttons">
            <button type="button" className="campus3d-btn" onClick={() => nudge(-0.18)} aria-label="Rotate campus left">
              <RotateCcw size={15} aria-hidden="true" />
            </button>
            <div
              className="campus3d-dial"
              role="slider"
              aria-label="Campus viewing angle"
              aria-valuemin={-100}
              aria-valuemax={100}
              aria-valuenow={yawPercent - 100}
              aria-valuetext={`${yawPercent}% around the campus`}
              tabIndex={0}
              onKeyDown={onKeyDown}
            >
              <span className="campus3d-dial-fill" style={{ width: `${yawPercent}%` }} />
            </div>
            <button type="button" className="campus3d-btn" onClick={() => nudge(0.18)} aria-label="Rotate campus right">
              <RotateCcw size={15} aria-hidden="true" style={{ transform: 'scaleX(-1)' }} />
            </button>
            <button type="button" className="campus3d-btn campus3d-btn-reset" onClick={reset} aria-label="Reset the campus view to the front">
              <RotateCcw size={14} aria-hidden="true" className="campus3d-reset-icon" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** The sun sits behind the scene; it fades in rather than animating forever. */
function Sun({ scene }: { scene: Scene }) {
  const sun = scene.billboards.find((item) => item.art === 'sun');
  if (!sun) return null;
  // A soft halo rather than a hard disc: it sits in the upper-left sky, far
  // behind the campus, and must not compete with the building for attention.
  const x = 150;
  const y = 118;
  return (
    <g className="campus3d-sun" transform={`translate(${x} ${y})`}>
      <circle r={76} fill="#F4E0A8" opacity={0.3} />
      <circle r={50} fill="#F7E8BE" opacity={0.55} />
      <circle r={30} fill="#FBF1D6" />
    </g>
  );
}

/** Screen-facing figures, so the plaza always has people in it. */
function Student({ alt }: { alt: boolean }) {
  const shirt = alt ? '#D99377' : '#E8B762';
  const trousers = alt ? '#3C6A5C' : '#244E46';
  const skin = alt ? '#B7805C' : '#C58A63';
  const hair = alt ? '#303E32' : '#243E35';
  return (
    <g>
      <ellipse cx="0" cy="1.1" rx="0.42" ry="0.09" fill="#7FA189" opacity="0.45" />
      <path d="M-0.13 0.52L-0.18 1.02M0.13 0.52L0.18 1.0" stroke={trousers} strokeWidth="0.15" strokeLinecap="round" />
      <path d="M-0.24 1.04H-0.11M0.11 1.02H0.25" stroke="#183E37" strokeWidth="0.09" strokeLinecap="round" />
      <path d="M-0.25 0.16C-0.31 0.2-0.33 0.34-0.31 0.54L0.31 0.54C0.33 0.34 0.31 0.2 0.25 0.16Z" fill={shirt} />
      <path d="M-0.24 0.2L-0.38 0.36L-0.4 0.5" stroke={shirt} strokeWidth="0.11" strokeLinecap="round" fill="none" />
      <path d="M-0.39 0.42L-0.42 0.52" stroke={skin} strokeWidth="0.1" strokeLinecap="round" />
      <g className="campus3d-wave">
        <path d="M0.24 0.2L0.38 0.1L0.46 -0.02" stroke={shirt} strokeWidth="0.11" strokeLinecap="round" fill="none" />
        <circle cx="0.47" cy="-0.05" r="0.055" fill={skin} />
      </g>
      <path d="M-0.06 0.14V0.05" stroke={skin} strokeWidth="0.1" />
      <circle cx="0" cy="-0.08" r="0.165" fill={skin} />
      <path d="M-0.16-0.1C-0.18-0.24-0.06-0.29 0.02-0.27C0.12-0.26 0.17-0.19 0.15-0.11L0.12-0.16C0.05-0.13-0.04-0.15-0.08-0.19C-0.1-0.14-0.13-0.12-0.16-0.1Z" fill={hair} />
      <circle cx="0.07" cy="-0.08" r="0.017" fill={hair} />
      <path d="M0.05-0.01L0.1-0.02" stroke="#8F573E" strokeWidth="0.018" strokeLinecap="round" />
    </g>
  );
}
