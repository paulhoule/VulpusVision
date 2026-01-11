
import type { RRData } from './App'

interface BpmDisplayProps {
  rrIntervals: RRData[]
}

const BpmDisplay = ({ rrIntervals }: BpmDisplayProps) => {
  if (rrIntervals.length === 0) return null

  const lastFive = rrIntervals.slice(-5).map(i => i.value)
  const averageRr = lastFive.reduce((a, b) => a + b, 0) / lastFive.length
  const bpm = Math.round(60000 / averageRr)

  return (
    <div style={{
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
    }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>BPM</div>
      <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{bpm}</div>
    </div>
  )
}

export default BpmDisplay
