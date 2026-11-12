import { useId } from 'react';
import type { DrilldownSceneId } from './drilldownVisuals';

/**
 * Decorative, finite animated vignettes for the Explore dialogs. They are
 * aria-hidden because the dialog title/intro already carry the meaning, and
 * every animation finishes in under five seconds (or is disabled entirely by
 * the landing page's reduced-motion rule).
 */

const PALETTES: Record<DrilldownSceneId, { accent: string; soft: string; pop: string }> = {
  academics: { accent: '#176b53', soft: '#e8f2e6', pop: '#e2b45d' },
  assessments: { accent: '#4f46e5', soft: '#eeedfa', pop: '#e2b45d' },
  'campus-operations': { accent: '#0f766e', soft: '#e6f2f0', pop: '#e2b45d' },
  principal: { accent: '#176b53', soft: '#e8f2e6', pop: '#e2b45d' },
  hod: { accent: '#2d735e', soft: '#e8f2e6', pop: '#e2b45d' },
  faculty: { accent: '#b45309', soft: '#faf0e3', pop: '#176b53' },
  operations: { accent: '#0f766e', soft: '#e6f2f0', pop: '#e2b45d' },
  finance: { accent: '#b45309', soft: '#faf0e3', pop: '#176b53' },
  students: { accent: '#0f766e', soft: '#e6f2f0', pop: '#e2b45d' },
  upskilling: { accent: '#4f46e5', soft: '#eeedfa', pop: '#e2b45d' },
};

function Person({ x, y, shirt, skin = '#c58a63', hair = '#243e35' }: { x: number; y: number; shirt: string; skin?: string; hair?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="dd-person">
        <ellipse cx="30" cy="104" rx="26" ry="5" fill="#193c32" opacity=".12" />
        <path d="M22 68L18 100M38 68L42 100" stroke="#244e46" strokeWidth="9" strokeLinecap="round" />
        <path d="M16 102H26M36 102H46" stroke="#183e37" strokeWidth="5" strokeLinecap="round" />
        <path d="M18 34C14 38 13 52 15 66L45 66C47 52 46 38 42 34Z" fill={shirt} />
        <path d="M18 38L8 56L16 62" stroke={shirt} strokeWidth="8" strokeLinecap="round" />
        <g className="dd-arm">
          <path d="M42 38L54 52L64 44" stroke={shirt} strokeWidth="8" strokeLinecap="round" />
          <path d="M56 50L64 44" stroke={skin} strokeWidth="6" strokeLinecap="round" />
        </g>
        <g className="dd-head">
          <path d="M26 26V36" stroke={skin} strokeWidth="7" />
          <circle cx="30" cy="16" r="13" fill={skin} />
          <path d="M17 14C17 4 26 0 32 2C40 4 44 10 42 16L38 10C32 14 24 12 20 18Z" fill={hair} />
          <circle cx="35" cy="16" r="1.4" fill="#243e35" />
          <path d="M33 22L37 21" stroke="#8f573e" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
}

function Sparkle({ x, y, color, delay = 0 }: { x: number; y: number; color: string; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path className="dd-pop" style={{ animationDelay: `${delay}s` }} d="M0 -8V8M-8 0H8" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function SceneArt({ scene, accent, pop }: { scene: DrilldownSceneId; accent: string; pop: string }) {
  switch (scene) {
    case 'academics':
      return (
        <>
          <g transform="translate(120 46)">
            <g className="dd-float">
              <rect width="120" height="112" rx="12" fill="#fffefa" stroke={accent} strokeWidth="2" />
              <rect width="120" height="28" rx="12" fill={accent} />
              <path d="M30 8V-4M90 8V-4" stroke={accent} strokeWidth="6" strokeLinecap="round" />
              <g className="dd-page">
                <rect x="14" y="42" width="92" height="56" rx="6" fill="#e8f2e6" />
                <path d="M26 56H94M26 70H94M26 84H70" stroke={accent} strokeWidth="4" strokeLinecap="round" opacity=".55" />
              </g>
            </g>
          </g>
          <g transform="translate(430 62)">
            <g className="dd-float" style={{ animationDelay: '.2s' }}>
              <circle cx="42" cy="42" r="40" fill="#fffefa" stroke={accent} strokeWidth="3" />
              <path className="dd-hour" d="M42 42V22" stroke={accent} strokeWidth="4" strokeLinecap="round" />
              <path className="dd-minute" d="M42 42L58 50" stroke={pop} strokeWidth="3" strokeLinecap="round" />
              <circle cx="42" cy="42" r="3.5" fill={accent} />
            </g>
          </g>
          <g transform="translate(540 118)">
            <g className="dd-bob">
              <rect x="0" y="26" width="86" height="14" rx="4" fill={accent} />
              <rect x="6" y="12" width="74" height="14" rx="4" fill={pop} />
              <rect x="12" y="0" width="62" height="12" rx="4" fill="#2d735e" />
            </g>
          </g>
          <Person x={290} y={70} shirt={accent} />
          <Sparkle x={392} y={44} color={pop} delay={0.4} />
        </>
      );
    case 'assessments':
      return (
        <>
          <g transform="translate(132 40)">
            <g className="dd-float">
              <rect width="132" height="140" rx="10" fill="#fffefa" stroke={accent} strokeWidth="2" />
              <rect x="40" y="-8" width="52" height="18" rx="6" fill={accent} />
              <path className="dd-draw" pathLength={1} d="M20 36H112M20 56H112M20 76H88" stroke="#9aa7b8" strokeWidth="4" strokeLinecap="round" />
              <g className="dd-pop" style={{ animationDelay: '.7s' }}>
                <circle cx="98" cy="106" r="16" fill={accent} />
                <path d="M90 106L96 112L107 99" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </g>
          </g>
          <g transform="translate(300 96)">
            <g className="dd-pencil">
              <path d="M0 40L44 -4L58 10L14 54Z" fill={pop} />
              <path d="M0 40L-6 60L14 54Z" fill="#f3d594" />
              <path d="M-6 60L-2 56L2 60Z" fill="#243e35" />
            </g>
          </g>
          <Person x={420} y={70} shirt={accent} skin="#b7805c" />
          <g transform="translate(560 70)">
            <g className="dd-pop" style={{ animationDelay: '.9s' }}>
              <circle cx="30" cy="30" r="28" fill="#fffefa" stroke={accent} strokeWidth="2" />
              <path d="M18 30L27 39L43 21" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
          <Sparkle x={540} y={44} color={pop} delay={1.1} />
        </>
      );
    case 'campus-operations':
    case 'operations':
      return (
        <>
          <g transform="translate(150 66)">
            <g className="dd-spin">
              <circle cx="40" cy="40" r="26" fill="none" stroke={accent} strokeWidth="10" />
              <path d="M40 4V16M40 64V76M4 40H16M64 40H76M15 15L23 23M57 57L65 65M65 15L57 23M23 57L15 65" stroke={accent} strokeWidth="9" strokeLinecap="round" />
              <circle cx="40" cy="40" r="9" fill="#fffefa" />
            </g>
          </g>
          <g transform="translate(238 108)">
            <g className="dd-spin-reverse">
              <circle cx="24" cy="24" r="16" fill="none" stroke={pop} strokeWidth="7" />
              <path d="M24 2V10M24 38V46M2 24H10M38 24H46" stroke={pop} strokeWidth="6" strokeLinecap="round" />
            </g>
          </g>
          <g transform="translate(382 48)">
            <g className="dd-float">
              <rect width="104" height="124" rx="8" fill="#fffefa" stroke={accent} strokeWidth="2" />
              <g className="dd-print">
                <path d="M18 30H86M18 48H86M18 66H64" stroke="#9aa7b8" strokeWidth="4" strokeLinecap="round" />
                <path d="M18 90H86" stroke={accent} strokeWidth="5" strokeLinecap="round" />
              </g>
            </g>
          </g>
          <g transform="translate(520 116)">
            <g className="dd-slide">
              <rect width="72" height="52" rx="6" fill={pop} />
              <path d="M0 18H72M36 0V18" stroke="#b98a34" strokeWidth="3" />
            </g>
          </g>
          <Person x={292} y={70} shirt={accent} />
        </>
      );
    case 'principal':
    case 'hod':
      return (
        <>
          <g transform="translate(130 44)">
            <g className="dd-float">
              <rect width="180" height="126" rx="12" fill="#fffefa" stroke={accent} strokeWidth="2" />
              <rect x="16" y="16" width="64" height="10" rx="5" fill={accent} opacity=".5" />
              <g className="dd-bars">
                <rect className="dd-bar" x="24" y="62" width="22" height="44" rx="4" fill={accent} />
                <rect className="dd-bar" x="58" y="46" width="22" height="60" rx="4" fill={pop} style={{ animationDelay: '.15s' }} />
                <rect className="dd-bar" x="92" y="34" width="22" height="72" rx="4" fill={accent} style={{ animationDelay: '.3s' }} />
                <rect className="dd-bar" x="126" y="54" width="22" height="52" rx="4" fill={pop} style={{ animationDelay: '.45s' }} />
              </g>
            </g>
          </g>
          <g transform="translate(392 58)">
            <g className="dd-bob">
              <path d="M0 96H120V40L60 8L0 40Z" fill="#fffefa" stroke={accent} strokeWidth="2" />
              <path d="M20 96V52H44V96M76 96V52H100V96" fill={accent} opacity=".25" />
              <path d="M60 8V-14" stroke={accent} strokeWidth="3" />
              <path className="dd-flag" d="M60 -14H92L84 -6L92 2H60Z" fill={pop} />
            </g>
          </g>
          <Person x={536} y={70} shirt={accent} />
          <Sparkle x={350} y={40} color={pop} delay={0.5} />
        </>
      );
    case 'faculty':
      return (
        <>
          <g transform="translate(140 42)">
            <g className="dd-float">
              <rect width="220" height="126" rx="10" fill="#173f33" />
              <rect x="10" y="10" width="200" height="106" rx="6" fill="none" stroke="#ffffff" strokeOpacity=".25" strokeWidth="2" />
              <path className="dd-draw" pathLength={1} d="M28 42H150M28 66H180M28 90H120" stroke="#fffdf2" strokeWidth="4" strokeLinecap="round" />
              <g className="dd-pencil">
                <rect x="168" y="96" width="34" height="8" rx="4" fill="#fffdf2" />
              </g>
            </g>
          </g>
          <Person x={400} y={70} shirt={accent} skin="#b7805c" />
          <g transform="translate(520 110)">
            <g className="dd-bob">
              <circle cx="28" cy="28" r="24" fill="#d99377" />
              <path d="M28 4C30 -2 38 -4 42 0" stroke="#438b6c" strokeWidth="4" fill="none" strokeLinecap="round" />
            </g>
          </g>
          <Sparkle x={480} y={48} color={pop} delay={0.6} />
        </>
      );
    case 'finance':
      return (
        <>
          <g transform="translate(150 52)">
            <g className="dd-float">
              <rect width="150" height="118" rx="10" fill="#fffefa" stroke={accent} strokeWidth="2" />
              <path d="M20 34H130M20 58H130M20 82H96" stroke="#9aa7b8" strokeWidth="4" strokeLinecap="round" />
              <path d="M20 100H130" stroke={accent} strokeWidth="5" strokeLinecap="round" />
            </g>
          </g>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${330 + i * 34} ${44 + i * 8})`}>
              <g className="dd-coin" style={{ animationDelay: `${0.2 + i * 0.18}s` }}>
                <circle cx="18" cy="18" r="17" fill={pop} stroke="#b98a34" strokeWidth="2" />
                <path d="M12 12H24M12 18H24M18 12V26" stroke="#7a5a1c" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            </g>
          ))}
          <g transform="translate(470 76)">
            <g className="dd-bob">
              <rect width="86" height="104" rx="10" fill={accent} />
              <rect x="12" y="12" width="62" height="22" rx="4" fill="#fffefa" />
              {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
                <rect key={`${r}-${c}`} className="dd-pop" style={{ animationDelay: `${0.5 + (r * 3 + c) * 0.06}s` }} x={14 + c * 22} y={44 + r * 18} width="16" height="12" rx="3" fill="#fffefa" opacity=".85" />
              )))}
            </g>
          </g>
          <Person x={580} y={70} shirt="#2d735e" />
        </>
      );
    case 'students':
      return (
        <>
          <g transform="translate(160 36)">
            <g className="dd-float">
              <rect width="96" height="152" rx="16" fill="#173f33" />
              <rect x="8" y="14" width="80" height="124" rx="8" fill="#fffefa" />
              <g className="dd-pop" style={{ animationDelay: '.4s' }}>
                <rect x="16" y="26" width="64" height="22" rx="6" fill={accent} />
              </g>
              <g className="dd-pop" style={{ animationDelay: '.7s' }}>
                <rect x="16" y="56" width="64" height="22" rx="6" fill={pop} />
              </g>
              <g className="dd-pop" style={{ animationDelay: '1s' }}>
                <rect x="16" y="86" width="64" height="22" rx="6" fill="#e8f2e6" />
              </g>
            </g>
          </g>
          <Person x={330} y={70} shirt={accent} />
          <g transform="translate(470 58)">
            <g className="dd-toss">
              <path d="M0 22L44 4L88 22L44 40Z" fill="#173f33" />
              <path d="M22 30V48C22 56 66 56 66 48V30" fill="#2d735e" />
              <path d="M88 22V44" stroke={pop} strokeWidth="3" strokeLinecap="round" />
              <circle cx="88" cy="46" r="4" fill={pop} />
            </g>
          </g>
          <Sparkle x={580} y={50} color={pop} delay={0.8} />
        </>
      );
    case 'upskilling':
      return (
        <>
          <path className="dd-draw" pathLength={1} d="M120 168C220 120 320 150 420 96S580 40 640 34" stroke={accent} strokeWidth="3" strokeDasharray="1" fill="none" opacity=".45" />
          {[120, 260, 400, 540].map((x, i) => (
            <g key={x} transform={`translate(${x} ${168 - i * 34})`}>
              <circle className="dd-pop" style={{ animationDelay: `${0.2 + i * 0.16}s` }} r="7" fill={pop} />
            </g>
          ))}
          <g transform="translate(420 60)">
            <g className="dd-launch">
              <path d="M30 0C46 14 50 40 42 64H18C10 40 14 14 30 0Z" fill="#fffefa" stroke={accent} strokeWidth="2" />
              <circle cx="30" cy="30" r="9" fill={accent} />
              <path d="M18 52L2 72L18 66M42 52L58 72L42 66" fill={accent} />
              <path className="dd-flame" d="M24 66C24 78 30 86 30 86C30 86 36 78 36 66Z" fill={pop} />
            </g>
          </g>
          <Person x={150} y={70} shirt={accent} />
          <Sparkle x={560} y={30} color={pop} delay={0.9} />
          <Sparkle x={620} y={70} color={accent} delay={1.2} />
        </>
      );
  }
}

export default function DrilldownScene({ scene }: { scene: DrilldownSceneId }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { accent, soft, pop } = PALETTES[scene];
  return (
    <div className={`landing-dialog-scene dd-scene-${scene}`} aria-hidden="true">
      <svg viewBox="0 0 720 220" focusable="false" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id={`dd-dots-${uid}`} width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill={accent} opacity=".16" />
          </pattern>
        </defs>
        <rect width="720" height="220" rx="16" fill={soft} />
        <rect width="720" height="220" rx="16" fill={`url(#dd-dots-${uid})`} />
        <circle className="dd-sun" cx="640" cy="46" r="24" fill={pop} opacity=".5" />
        <path className="dd-cloud" d="M80 48H140M96 36H150M560 92H620" stroke="#fffefa" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="360" cy="196" rx="300" ry="14" fill={accent} opacity=".1" />
        <SceneArt scene={scene} accent={accent} pop={pop} />
      </svg>
    </div>
  );
}
