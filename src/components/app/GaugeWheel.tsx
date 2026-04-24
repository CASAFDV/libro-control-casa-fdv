'use client'

import { getScoreColor } from '@/lib/auth'

interface GaugeWheelProps {
  score: number
  size?: number
  showLabel?: boolean
}

export default function GaugeWheel({ score, size = 100, showLabel = true }: GaugeWheelProps) {
  const color = getScoreColor(score)
  const percentage = (score / 20) * 100
  const strokeWidth = size * 0.1
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  const center = size / 2

  // Color glow effect
  const getGlowClass = () => {
    if (score < 9.5) return ''
    if (score < 12.5) return 'glow-red'
    if (score < 16.5) return 'glow-yellow'
    if (score < 17.5) return 'glow-blue'
    return 'glow-green'
  }

  return (
    <div className={`relative inline-flex flex-col items-center ${getGlowClass()} rounded-full`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease-in-out',
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />
        {/* Decorative outer ring */}
        <circle
          cx={center}
          cy={center}
          r={radius + strokeWidth / 2 + 2}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={1}
        />
      </svg>
      {/* Score text in center - absolutely positioned over the SVG */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <span
          className="font-bold"
          style={{ color, fontSize: size * 0.25, textShadow: `0 0 10px ${color}60` }}
        >
          {score.toFixed(1)}
        </span>
        {showLabel && (
          <span className="text-[10px] text-white/40">/20</span>
        )}
      </div>
    </div>
  )
}
