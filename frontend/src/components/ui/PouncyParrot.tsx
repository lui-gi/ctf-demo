import { useState } from 'react'

interface Props { dataText: string }

function parse(dataText: string) {
  const nMatch = dataText.match(/n\s*=\s*(.+)/)
  const eMatch = dataText.match(/e\s*=\s*(.+)/)
  const cMatch = dataText.match(/c\s*=\s*([\s\S]+)/)
  return [
    nMatch ? nMatch[1].trim() : '?',
    eMatch ? eMatch[1].trim() : '?',
    cMatch ? cMatch[1].trim() : '?',
  ]
}

const PARROT_SIZE = 240 // px
const BUBBLE_BOTTOM_OFFSET = PARROT_SIZE + 18 // sits above parrot + triangle gap

const swayStyle = `
  @keyframes pouncy-hint-sway {
    0%   { transform: translateX(-50%) rotate(-4deg); }
    50%  { transform: translateX(-50%) rotate(4deg); }
    100% { transform: translateX(-50%) rotate(-4deg); }
  }
`

// step 0 = silent, 1..6 loop: n, squawk, e, squawk, c, squawk
const SQUAWK_WORDS = ['SQUAWK!', 'Brawwk!', 'RAWK!']

export default function PouncyParrot({ dataText }: Props) {
  const [step, setStep] = useState(0)
  const values = parse(dataText)

  const label = step === 0 ? null
              : step === 1 ? values[0]
              : step === 2 ? SQUAWK_WORDS[0]
              : step === 3 ? values[1]
              : step === 4 ? SQUAWK_WORDS[1]
              : step === 5 ? values[2]
              :               SQUAWK_WORDS[2]

  function handleClick() {
    setStep(s => s === 0 ? 1 : (s % 6) + 1)
  }

  return (
    // Reserve vertical space: tall enough for the "c" bubble (≈140px) + gap + parrot
    <div
      className="select-none"
      style={{ position: 'relative', width: '100%', height: `${PARROT_SIZE + 170}px` }}
    >
      <style>{swayStyle}</style>
      {/* Speech bubble — grows upward, parrot never moves */}
      {label && (
        <div style={{
          position: 'absolute',
          bottom: `${BUBBLE_BOTTOM_OFFSET}px`,
          left: '50%',
          transform: 'translateX(-50%)',
        }}>
          {step % 2 === 0 ? (
            <div
              style={{
                background: '#ffffff',
                border: '2px solid #000000',
                borderRadius: '10px',
                padding: '10px 20px',
                fontFamily: '"Special Elite", cursive',
                fontSize: '1.5rem',
                fontWeight: 900,
                color: '#2a1a08',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
            >{label}</div>
          ) : (
            <pre
              className="select-text"
              style={{
                background: '#ffffff',
                border: '2px solid #000000',
                borderRadius: '10px',
                padding: '10px 16px',
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: '0.9rem',
                color: '#2a1a08',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxWidth: '340px',
                margin: 0,
              }}
            >{label}</pre>
          )}
          {/* Triangle pointer */}
          <div style={{
            position: 'absolute',
            bottom: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '12px solid #000000',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-9px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '10px solid #ffffff',
          }} />
        </div>
      )}

      {/* Parrot — anchored at bottom center */}
      <img
        src="/assets/pouncy.png"
        alt="Pouncy the parrot"
        onClick={handleClick}
        draggable={false}
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: `${PARROT_SIZE}px`,
          cursor: 'pointer',
        }}
      />

      {/* Hint */}
      {step === 0 && (
        <p
          className="font-poster"
          style={{
            position: 'absolute',
            bottom: `-2rem`,
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#8a2a1f',
            letterSpacing: '0.05em',
            animation: 'pouncy-hint-sway 1.4s ease-in-out infinite',
            transformOrigin: 'center bottom',
          }}
        >
          Click Pouncy to make him talk!
        </p>
      )}
    </div>
  )
}
