import type { ReactNode } from 'react'
import './SmallWidget.css'

interface SmallWidgetProps {
  label: string
  value: ReactNode
  className?: string
}

const SmallWidget = ({ label, value, className = '' }: SmallWidgetProps) => {
  return (
    <div className={`small-widget ${className}`}>
      <div className="small-widget-label">{label}</div>
      <div className="small-widget-value">{value}</div>
    </div>
  )
}

export default SmallWidget
