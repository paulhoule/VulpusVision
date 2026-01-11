import type { CSSProperties } from 'react'
import type { RRData } from './App'

interface SdDisplayProps {
  rrIntervals: RRData[]
}

const SdDisplay = ({ rrIntervals }: SdDisplayProps) => {
  if (rrIntervals.length < 2) return null

  const values = rrIntervals.map(i => i.value)
  
  // Calculate pairs (x_i, x_{i+1})
  const pairs: [number, number][] = []
  for (let i = 0; i < values.length - 1; i++) {
    pairs.push([values[i], values[i + 1]])
  }

  // SD1: standard deviation of (x_{i+1} - x_i) / sqrt(2)
  const d1 = pairs.map(([x, y]) => (y - x) / Math.sqrt(2))
  const mean1 = d1.reduce((a, b) => a + b, 0) / d1.length
  const sd1 = Math.sqrt(d1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / d1.length)

  // SD2: standard deviation of (x_{i+1} + x_i) / sqrt(2)
  const d2 = pairs.map(([x, y]) => (y + x) / Math.sqrt(2))
  const mean2 = d2.reduce((a, b) => a + b, 0) / d2.length
  const sd2 = Math.sqrt(d2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / d2.length)

  const boxStyle: CSSProperties = {
    border: '2px solid #333',
    borderRadius: '8px',
    padding: '10px',
    width: '120px',
    height: '120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    margin: '10px'
  }

  const labelStyle: CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666',
    marginBottom: '5px'
  }

  const valueStyle: CSSProperties = {
    fontSize: '48px',
    fontWeight: 'bold'
  }

  return (
    <>
      <div style={boxStyle}>
        <div style={labelStyle}>SD1</div>
        <div style={valueStyle}>{Math.round(sd1)}</div>
      </div>
      <div style={boxStyle}>
        <div style={labelStyle}>SD2</div>
        <div style={valueStyle}>{Math.round(sd2)}</div>
      </div>
    </>
  )
}

export default SdDisplay
