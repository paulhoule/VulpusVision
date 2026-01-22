import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { RRData } from './App'

interface TimeSeriesPlotProps {
  data: RRData[]
}

const margin = { top: 10, right: 30, bottom: 40, left: 50 }

const TimeSeriesPlot = ({ data }: TimeSeriesPlotProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return

    const width = containerRef.current.clientWidth - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    // Calculate BPM for each point
    const plotData = data.map(d => ({
      timestamp: d.timestamp,
      bpm: Math.round(60000 / d.value)
    }))

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('class', 'time-series-svg')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const xExtent = d3.extent(plotData, d => d.timestamp) as [number, number]
    if (xExtent[0] === xExtent[1]) {
      xExtent[0] -= 1000
      xExtent[1] += 1000
    }
    const minTimestamp = d3.min(plotData, d => d.timestamp) || 0
    const x = d3.scaleLinear()
      .domain(xExtent)
      .range([0, width])

    const bpmExtent = d3.extent(plotData, d => d.bpm) as [number, number]
    let [yMin, yMax] = bpmExtent
    if (yMin === yMax) {
      yMin -= 5
      yMax += 5
    } else {
      const padding = (yMax - yMin) * 0.1
      yMin -= padding
      yMax += padding
    }

    const y = d3.scaleLinear()
      .domain([Math.max(0, yMin), yMax])
      .range([height, 0])

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => {
        const seconds = (d as number - minTimestamp) / 1000
        return `${seconds.toFixed(0)}s`
      }))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', '#666')
      .style('text-anchor', 'middle')
      .text('Time (s)')

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('fill', '#666')
      .style('text-anchor', 'middle')
      .text('Heart Rate (BPM)')

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('stroke-opacity', 0.1)
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ''))

    // Add the line
    const line = d3.line<{timestamp: number, bpm: number}>()
      .x(d => x(d.timestamp))
      .y(d => y(d.bpm))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(plotData)
      .attr('fill', 'none')
      .attr('stroke', '#ff4444')
      .attr('stroke-width', 2)
      .attr('d', line)

    // Add dots
    g.selectAll('circle')
      .data(plotData)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.timestamp))
      .attr('cy', d => y(d.bpm))
      .attr('r', 2)
      .attr('fill', '#ff4444')

  }, [data])

  return (
    <div ref={containerRef} style={{ width: '100%', minHeight: '250px' }}>
      <svg ref={svgRef} />
    </div>
  )
}

export default TimeSeriesPlot
