// Lightweight, self-contained artwork for the static game catalogue.
// The parent .game-art surface supplies the coloured gradient behind this SVG.
import './gameIllustration.css'

function Pharaoh() {
  return (
    <>
      <path
        className="game-illustration-gold"
        d="M75 112V67l10-25 35-12 35 12 10 25v45H75Z"
      />
      <path
        className="game-illustration-dark"
        d="M88 66h74M83 78h84M96 44l24-10 24 10-6 16h-36l-6-16Z"
      />
      <path
        className="game-illustration-light"
        d="m120 47 9 11-9 18-9-18 9-11ZM103 84h34v28h-34z"
      />
      <circle className="game-illustration-accent" cx="120" cy="93" r="5" />
      <path className="game-illustration-dark" d="M112 112V91h16v21" />
    </>
  )
}

function Ocean() {
  return (
    <>
      <path
        className="game-illustration-light"
        d="M30 109c18-30 35 14 54-15s36 24 56-7 36 15 70-13v45H30Z"
      />
      <path
        className="game-illustration-dark"
        d="M30 121c25-23 43 12 65-12s37 18 58-8 35 12 67-12"
      />
      <g className="game-illustration-seven">
        <text x="120" y="83" textAnchor="middle">
          777
        </text>
      </g>
      <circle className="game-illustration-accent" cx="49" cy="54" r="7" />
      <circle className="game-illustration-accent" cx="190" cy="42" r="5" />
    </>
  )
}

function Fruit() {
  return (
    <>
      <circle className="game-illustration-red" cx="82" cy="91" r="27" />
      <path
        className="game-illustration-dark"
        d="M82 63c0-10 8-17 18-17M86 54c8-9 18-9 25-4"
      />
      <circle className="game-illustration-yellow" cx="126" cy="103" r="31" />
      <path
        className="game-illustration-dark"
        d="m126 72 7-12M129 64c12-7 21-3 26 4"
      />
      <path className="game-illustration-green" d="m165 69 29 11-9 39-34-5Z" />
      <path className="game-illustration-light" d="m165 69 2-15 11 12" />
      <circle className="game-illustration-light" cx="74" cy="84" r="6" />
      <circle className="game-illustration-light" cx="116" cy="94" r="6" />
    </>
  )
}

function Western() {
  return (
    <>
      <path
        className="game-illustration-gold"
        d="m120 31 14 16 27 2-8 24 8 25-27 2-14 18-14-18-27-2 8-25-8-24 27-2 14-16Z"
      />
      <path
        className="game-illustration-dark"
        d="M80 54c13-19 67-19 80 0-18 8-62 8-80 0ZM96 67h48"
      />
      <circle className="game-illustration-light" cx="120" cy="83" r="20" />
      <path
        className="game-illustration-dark"
        d="M108 89c7 8 17 8 24 0M111 80h1M128 80h1"
      />
    </>
  )
}

function Fish() {
  return (
    <>
      <path
        className="game-illustration-gold"
        d="M53 91c20-30 62-30 88 0-26 30-68 30-88 0Z"
      />
      <path className="game-illustration-gold" d="m53 91-25-19v38l25-19Z" />
      <circle className="game-illustration-dark" cx="119" cy="85" r="4" />
      <path className="game-illustration-light" d="M107 98c14 9 25 8 36 0" />
      <circle className="game-illustration-light" cx="185" cy="59" r="11" />
      <circle className="game-illustration-light" cx="161" cy="42" r="6" />
      <circle className="game-illustration-light" cx="197" cy="91" r="6" />
    </>
  )
}

function Bubbles() {
  return (
    <>
      <circle className="game-illustration-pink" cx="78" cy="92" r="25" />
      <circle className="game-illustration-yellow" cx="120" cy="70" r="25" />
      <circle className="game-illustration-cyan" cx="163" cy="94" r="25" />
      <circle className="game-illustration-purple" cx="119" cy="111" r="24" />
      <circle className="game-illustration-light" cx="70" cy="84" r="6" />
      <circle className="game-illustration-light" cx="112" cy="62" r="6" />
      <circle className="game-illustration-light" cx="155" cy="85" r="6" />
    </>
  )
}

function Dice() {
  return (
    <>
      <rect
        className="game-illustration-light"
        x="55"
        y="51"
        width="65"
        height="65"
        rx="13"
        transform="rotate(-12 55 51)"
      />
      <rect
        className="game-illustration-gold"
        x="120"
        y="54"
        width="65"
        height="65"
        rx="13"
        transform="rotate(12 120 54)"
      />
      <circle className="game-illustration-dark" cx="82" cy="76" r="5" />
      <circle className="game-illustration-dark" cx="100" cy="94" r="5" />
      <circle className="game-illustration-dark" cx="151" cy="74" r="5" />
      <circle className="game-illustration-dark" cx="169" cy="74" r="5" />
      <circle className="game-illustration-dark" cx="160" cy="94" r="5" />
    </>
  )
}

function Golf() {
  return (
    <>
      <path
        className="game-illustration-green"
        d="M25 119c34-34 76-20 105-30 31-11 51-28 85-9v39H25Z"
      />
      <path className="game-illustration-light" d="M120 108V43" />
      <path
        className="game-illustration-red"
        d="M120 44h45l-22 18 22 18h-45Z"
      />
      <circle className="game-illustration-light" cx="79" cy="113" r="11" />
      <path className="game-illustration-dark" d="M79 113c19-17 35-17 48-5" />
    </>
  )
}

const scenes = {
  'golden-pharaoh': Pharaoh,
  'ocean-777': Ocean,
  'fruit-party': Fruit,
  'wild-west-deluxe': Western,
  'fish-hunter': Fish,
  'bubble-pop': Bubbles,
  'dice-merge': Dice,
  'mini-golf-rush': Golf,
}

export default function GameIllustration({ id, compact = false }) {
  const Scene = scenes[id] || scenes['bubble-pop']
  return (
    <svg
      className={`game-illustration${compact ? ' game-illustration-compact' : ''}`}
      viewBox="0 0 240 170"
      aria-hidden="true"
      focusable="false"
    >
      <g className="game-illustration-scene">
        <Scene />
      </g>
    </svg>
  )
}

export { GameIllustration }
