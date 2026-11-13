import { useId } from 'react';
import '../styles/portalExperience.css';

export type PortalScene = 'dashboard' | 'academics' | 'learning' | 'faculty' | 'hod' | 'principal' | 'accounts' | 'operations' | 'superadmin' | 'employee';

/** Small, decorative SVG scenes in the landing page's mint / paper / gold
 * palette. No image requests or animation runtime. Motion finishes within
 * five seconds and becomes completely static with prefers-reduced-motion.
 */
function Learner() {
  return (
    <g transform="translate(68 88)">
      <g className="portal-scene-person">
        <ellipse cx="35" cy="119" rx="30" ry="5" fill="var(--scene-ink)" opacity=".12" />
        <path d="M26 77L22 112M43 77L49 112" stroke="var(--scene-ink)" strokeWidth="11" strokeLinecap="round" />
        <path d="M14 115H27M45 115H58" stroke="#243e35" strokeWidth="6" strokeLinecap="round" />
        <path d="M20 39C15 48 15 62 17 78L49 78C53 62 51 46 45 39Z" fill="var(--scene-gold)" />
        <path d="M20 44L9 66L22 73" stroke="var(--scene-gold)" strokeWidth="9" strokeLinecap="round" />
        <path d="M14 68L25 71" stroke="#c58a63" strokeWidth="6" strokeLinecap="round" />
        <g className="portal-scene-wave">
          <path d="M46 45L61 57L73 43" stroke="var(--scene-gold)" strokeWidth="9" strokeLinecap="round" />
          <path d="M65 53L73 43" stroke="#c58a63" strokeWidth="6" strokeLinecap="round" />
          <path d="M69 42L78 34M73 42L82 40" stroke="#c58a63" strokeWidth="4" strokeLinecap="round" />
        </g>
        <g className="portal-scene-head">
          <path d="M32 31V42" stroke="#c58a63" strokeWidth="8" />
          <ellipse cx="34" cy="20" rx="15" ry="17" fill="#c58a63" />
          <path d="M19 21C13 6 24-2 37 1C50 1 54 14 48 22L43 12C35 17 27 13 23 23Z" fill="#243e35" />
          <circle cx="42" cy="21" r="1.5" fill="#243e35" />
          <path d="M39 29L44 27" stroke="#8f573e" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
}

function DashboardArt() {
  return (
    <>
      <path d="M145 180H289M159 182L155 207M275 182L280 207" stroke="var(--scene-ink)" strokeWidth="6" strokeLinecap="round" />
      <g className="portal-scene-float">
        <path d="M174 103H270L260 171H164Z" fill="var(--scene-paper)" stroke="var(--scene-ink)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M157 173H271" stroke="var(--scene-ink)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="217" cy="136" r="15" fill="var(--scene-mint)" />
        <path d="M210 136L215 141L225 130" stroke="var(--scene-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      <g transform="translate(198 39)">
        <g className="portal-scene-token">
          <path d="M0 18L33 3L66 18L33 33Z" fill="var(--scene-ink)" />
          <path d="M14 25V37C25 45 42 45 53 37V25" fill="var(--scene-accent)" />
          <path d="M65 19V42" stroke="var(--scene-gold)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="65" cy="44" r="3" fill="var(--scene-gold)" />
        </g>
      </g>
      <rect x="186" y="198" width="62" height="10" rx="3" fill="var(--scene-accent)" />
      <path d="M193 201H239" stroke="var(--scene-paper)" strokeWidth="2" opacity=".7" />
      <rect x="196" y="188" width="57" height="10" rx="3" fill="var(--scene-gold)" />
    </>
  );
}

function AcademicsArt() {
  return (
    <>
      <g transform="translate(165 67)">
        <g className="portal-scene-float">
          <rect width="114" height="132" rx="12" fill="var(--scene-paper)" stroke="var(--scene-ink)" strokeWidth="2.5" />
          <path d="M12 0H102Q114 0 114 12V31H0V12Q0 0 12 0" fill="var(--scene-accent)" />
          <path d="M28 -7V9M86 -7V9" stroke="var(--scene-ink)" strokeWidth="5" strokeLinecap="round" />
          <path d="M17 47H97" stroke="var(--scene-line)" strokeWidth="3" strokeLinecap="round" />
          {[0, 1, 2].map((row) => [0, 1, 2, 3].map((column) => (
            <rect key={`${row}-${column}`} x={17 + column * 22} y={60 + row * 20} width="14" height="12" rx="3" fill={row === 1 && column === 1 ? 'var(--scene-gold)' : 'var(--scene-mint)'} />
          )))}
          <path d="M41 86L44 89L49 82" stroke="var(--scene-ink)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      <g transform="translate(50 51)">
        <g className="portal-scene-token">
          <circle r="23" fill="var(--scene-paper)" stroke="var(--scene-line)" strokeWidth="2" />
          <circle r="17" fill="none" stroke="var(--scene-mint)" strokeWidth="2" strokeDasharray="2 6" />
          <path d="M0 -11V0L8 4" stroke="var(--scene-accent)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      </g>
    </>
  );
}

function LearningArt() {
  return (
    <>
      <path d="M152 87C175 40 250 37 278 84" stroke="var(--scene-line)" strokeWidth="2" strokeDasharray="4 6" fill="none" />
      <g transform="translate(215 44)">
        <g className="portal-scene-token">
          <path d="M14 0C30 13 33 30 27 46H2C-4 30 0 13 14 0Z" fill="var(--scene-paper)" stroke="var(--scene-ink)" strokeWidth="2" />
          <circle cx="14" cy="22" r="7" fill="var(--scene-accent)" />
          <path d="M2 34L-8 49L3 44M27 34L37 49L26 44" fill="var(--scene-accent)" />
          <path d="M9 49L14 62L19 49" fill="var(--scene-gold)" />
        </g>
      </g>
      <g className="portal-scene-float">
        <path d="M146 126C171 114 193 120 215 134C239 120 264 114 287 126V187C262 178 237 184 215 198C191 184 168 178 146 187Z" fill="var(--scene-accent)" stroke="var(--scene-ink)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M150 118C173 109 193 115 215 129C238 115 260 109 283 118V178C258 173 238 178 215 191C192 178 174 173 150 178Z" fill="var(--scene-paper)" />
        <path d="M215 130V190" stroke="var(--scene-line)" strokeWidth="2" />
        <path d="M163 135C178 132 192 137 202 143M163 148C178 145 192 150 202 156M163 161C174 159 184 162 190 165M228 142C242 136 256 133 270 135M228 155C242 149 256 146 270 148M228 168C237 164 247 161 255 161" stroke="var(--scene-line)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M250 118V146L257 141L264 144V116" fill="var(--scene-gold)" />
      </g>
    </>
  );
}

function LeadershipArt() {
  return (
    <g className="portal-scene-float">
      <path d="M155 103L222 63L289 103Z" fill="var(--scene-accent)" stroke="var(--scene-ink)" strokeWidth="2" />
      <path d="M166 103H279V194H166Z" fill="var(--scene-paper)" stroke="var(--scene-ink)" strokeWidth="2" />
      <path d="M180 114V185M202 114V185M242 114V185M264 114V185" stroke="var(--scene-mint)" strokeWidth="8" />
      <path d="M211 194V151A11 11 0 0 1 233 151V194" fill="var(--scene-accent)" />
      <circle cx="222" cy="94" r="10" fill="var(--scene-gold)" />
      <path d="M222 88V94L227 97" stroke="var(--scene-ink)" strokeWidth="2" strokeLinecap="round" />
      <path d="M156 198H289" stroke="var(--scene-line)" strokeWidth="7" strokeLinecap="round" />
    </g>
  );
}

function AccountsArt() {
  return (
    <>
      <g className="portal-scene-float">
        <rect x="164" y="66" width="111" height="135" rx="12" fill="var(--scene-paper)" stroke="var(--scene-ink)" strokeWidth="2" />
        <path d="M181 88H253M181 103H234" stroke="var(--scene-line)" strokeWidth="4" strokeLinecap="round" />
        <path d="M185 175V148M214 175V136M244 175V118" stroke="var(--scene-accent)" strokeWidth="13" strokeLinecap="round" />
        <path d="M181 186H257" stroke="var(--scene-line)" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="portal-scene-token">
        <circle cx="275" cy="165" r="24" fill="var(--scene-gold)" stroke="var(--scene-paper)" strokeWidth="3" />
        <path d="M266 154H284M266 160H284M269 154C283 154 283 166 268 166L281 178" stroke="var(--scene-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  );
}

function OperationsArt() {
  return (
    <>
      <g className="portal-scene-float">
        <rect x="166" y="70" width="107" height="127" rx="12" fill="var(--scene-paper)" stroke="var(--scene-ink)" strokeWidth="2" />
        <rect x="194" y="60" width="51" height="19" rx="6" fill="var(--scene-accent)" />
        {[104, 133, 162].map((y) => <g key={y}><rect x="181" y={y} width="16" height="16" rx="4" fill="var(--scene-mint)" /><path d={`M185 ${y + 8}L189 ${y + 12}L195 ${y + 4}`} stroke="var(--scene-accent)" strokeWidth="2" strokeLinecap="round" /><path d={`M210 ${y + 5}H254M210 ${y + 12}H241`} stroke="var(--scene-line)" strokeWidth="3" strokeLinecap="round" /></g>)}
      </g>
      <g className="portal-scene-token">
        <path d="M256 166L278 156L301 166V194L278 205L256 194Z" fill="var(--scene-gold)" stroke="var(--scene-ink)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M256 166L278 177L301 166M278 177V205M267 161L290 171" stroke="var(--scene-ink)" strokeWidth="2" />
      </g>
    </>
  );
}

function NetworkArt() {
  return (
    <>
      <path d="M179 102L241 65L283 150L179 166Z" stroke="var(--scene-accent)" strokeWidth="2" strokeDasharray="4 5" />
      {[[150, 78], [218, 40], [253, 130]].map(([x, y], index) => <g key={x} transform={`translate(${x} ${y})`}><g className={index === 1 ? 'portal-scene-token' : 'portal-scene-float'}><rect width="58" height="55" rx="10" fill="var(--scene-paper)" stroke="var(--scene-line)" strokeWidth="2" /><path d="M10 24L29 12L48 24M15 25V44H43V25M25 44V33H33V44" stroke="var(--scene-accent)" strokeWidth="2.5" strokeLinejoin="round" /><circle cx="48" cy="8" r="6" fill="var(--scene-gold)" /></g></g>)}
      <path d="M167 197H258" stroke="var(--scene-line)" strokeWidth="6" strokeLinecap="round" />
    </>
  );
}

function SceneArt({ scene }: { scene: PortalScene }) {
  if (scene === 'dashboard') return <DashboardArt />;
  if (scene === 'learning') return <LearningArt />;
  if (scene === 'accounts') return <AccountsArt />;
  if (scene === 'operations') return <OperationsArt />;
  if (scene === 'superadmin') return <NetworkArt />;
  if (scene === 'hod' || scene === 'principal') return <LeadershipArt />;
  return <AcademicsArt />;
}

export default function PortalIllustration({ scene = 'dashboard', className = '' }: { scene?: PortalScene; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const dotsId = `portal-scene-dots-${uid}`;
  return (
    <svg
      className={`portal-illustration ${className}`.trim()}
      data-scene={scene}
      width="360"
      height="240"
      viewBox="0 0 360 240"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={dotsId} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="var(--scene-grid)" opacity=".28" />
        </pattern>
      </defs>
      <path d="M25 207V135C25 63 86 16 180 16S335 63 335 135V207Z" fill="var(--scene-backdrop)" />
      <path d="M25 207V135C25 63 86 16 180 16S335 63 335 135V207Z" fill={`url(#${dotsId})`} />
      <circle cx="291" cy="62" r="22" fill="var(--scene-gold)" opacity=".7" />
      <path d="M105 48H146M116 38H151M283 105H316" stroke="var(--scene-paper)" strokeWidth="5" strokeLinecap="round" opacity=".8" />
      <ellipse cx="180" cy="211" rx="154" ry="14" fill="var(--scene-ground)" />
      <g className="portal-scene-plant">
        <path d="M309 201V158M309 186L297 175M309 178L322 165" stroke="var(--scene-accent)" strokeWidth="3" strokeLinecap="round" />
        <path d="M309 169C291 163 296 149 308 153C317 140 326 153 309 169M298 179C281 179 283 165 295 169M315 184C332 183 337 169 325 170" fill="var(--scene-accent)" />
        <path d="M296 196H322L318 212H300Z" fill="var(--scene-gold)" />
      </g>
      <SceneArt scene={scene} />
      <Learner />
      <g className="portal-scene-spark" stroke="var(--scene-gold)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M155 38V50M149 44H161M44 131V141M39 136H49" />
        <path d="M302 127V139M296 133H308" />
      </g>
      <circle cx="136" cy="88" r="3" fill="var(--scene-accent)" />
      <circle cx="56" cy="189" r="3" fill="var(--scene-gold)" />
    </svg>
  );
}
