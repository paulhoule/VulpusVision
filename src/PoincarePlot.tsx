import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { RRData } from './App'

interface PoincarePlotProps {
  data: RRData[]
}

const PoincarePlot = ({ data }: PoincarePlotProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const margin = { top: 20, right: 20, bottom: 40, left: 50 }
  const width = 400 - margin.left - margin.right
  const height = 400 - margin.top - margin.bottom

  useEffect(() => {
    if (!svgRef.current) return

    const values = data.map(d => d.value)
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const extent = d3.extent(values) as [number, number]
    let min = extent[0] ?? 800
    let max = extent[1] ?? 1200

    // Ensure there's at least some range even if data is static
    if (min === max) {
      min -= 50
      max += 50
    } else {
      const padding = (max - min) * 0.1
      min -= padding
      max += padding
    }

    const domain: [number, number] = [min, max]

    const x = d3.scaleLinear().domain(domain).range([0, width])
    const y = d3.scaleLinear().domain(domain).range([height, 0])

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('RR_i (ms)')

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('RR_i+1 (ms)')

    // Prepare pairs
    const pairs: [number, number][] = []
    for (let i = 0; i < values.length - 1; i++) {
      pairs.push([values[i], values[i + 1]])
    }

    // Add identity line
    g.append('line')
      .attr('x1', x(domain[0]))
      .attr('y1', y(domain[0]))
      .attr('x2', x(domain[1]))
      .attr('y2', y(domain[1]))
      .attr('stroke', '#ddd')
      .attr('stroke-dasharray', '4')

    // Add dots
    g.selectAll('circle')
      .data(pairs)
      .enter()
      .append('circle')
      .attr('cx', d => x(d[0]))
      .attr('cy', d => y(d[1]))
      .attr('r', 3)
      .attr('fill', '#69b3a2')
      .attr('opacity', 0.6)

  }, [data])

  return (
    <svg
      ref={svgRef}
      width={width + margin.left + margin.right}
      height={height + margin.top + margin.bottom}
      style={{ border: '1px solid #eee', borderRadius: '8px', backgroundColor: 'white', margin: '10px' }}
    />
  )
}

export default PoincarePlot
