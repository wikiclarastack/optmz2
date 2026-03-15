"use client"

import { useEffect, useState, useRef } from "react"

const stats = [
  { value: 50000, label: "Usuários Ativos", suffix: "+" },
  { value: 99, label: "Taxa de Satisfação", suffix: "%" },
  { value: 500, label: "GB Liberados/Dia", suffix: "+" },
  { value: 24, label: "Suporte", suffix: "/7" },
]

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [current, setCurrent] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const duration = 2000
    const steps = 60
    const increment = value / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      setCurrent(Math.min(Math.floor(increment * currentStep), value))

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isVisible, value])

  return (
    <div ref={ref} className="text-4xl sm:text-5xl font-bold text-foreground">
      {current.toLocaleString("pt-BR")}
      <span className="text-primary">{suffix}</span>
    </div>
  )
}

export function StatsSection() {
  return (
    <section className="relative py-24 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
