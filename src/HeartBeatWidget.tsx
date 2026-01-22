import { useState, useEffect } from 'react'
import SmallWidget from './SmallWidget'

interface HeartBeatWidgetProps {
  lastTimestamp: number
}

const HeartBeatWidget = ({ lastTimestamp }: HeartBeatWidgetProps) => {
  const [lit, setLit] = useState(false)

  useEffect(() => {
    if (lastTimestamp === 0) return

    // Use a timeout to avoid synchronous setState during effect execution
    const t1 = setTimeout(() => setLit(true), 0)
    const t2 = setTimeout(() => {
      setLit(false)
    }, 100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [lastTimestamp])

  return (
    <SmallWidget
      label="BEAT"
      className={`heart-beat-widget ${lit ? 'lit' : ''}`}
      value={
        <span className={`heart-icon ${lit ? 'lit' : ''}`} style={{ fontSize: '48px' }}>
          ❤️
        </span>
      }
    />
  )
}

export default HeartBeatWidget
