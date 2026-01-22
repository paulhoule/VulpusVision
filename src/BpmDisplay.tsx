
import type { RRData } from './App'
import SmallWidget from './SmallWidget'

interface BpmDisplayProps {
  rrIntervals: RRData[]
}

const BpmDisplay = ({ rrIntervals }: BpmDisplayProps) => {
  if (rrIntervals.length === 0) return null

  const lastFive = rrIntervals.slice(-5).map(i => i.value)
  const averageRr = lastFive.reduce((a, b) => a + b, 0) / lastFive.length
  const bpm = Math.round(60000 / averageRr)

  return <SmallWidget label="BPM" value={bpm} />
}

export default BpmDisplay
