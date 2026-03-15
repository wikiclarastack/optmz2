"use client"

import { useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Cpu, HardDrive, Gauge, Shield, Trash2, Zap } from "lucide-react"

const features = [
  {
    icon: Cpu,
    title: "Otimização de CPU",
    description: "Gerencie processos e maximize o desempenho do processador com ajustes inteligentes.",
  },
  {
    icon: HardDrive,
    title: "Limpeza de Disco",
    description: "Remova arquivos temporários, cache e lixo do sistema para liberar espaço.",
  },
  {
    icon: Gauge,
    title: "Boost de Memória",
    description: "Otimize o uso de RAM e libere memória para suas aplicações mais importantes.",
  },
  {
    icon: Shield,
    title: "Proteção do Sistema",
    description: "Monitore e proteja seu PC contra ameaças e programas indesejados.",
  },
  {
    icon: Trash2,
    title: "Limpeza de Registro",
    description: "Corrija erros e otimize o registro do Windows para melhor estabilidade.",
  },
  {
    icon: Zap,
    title: "Inicialização Rápida",
    description: "Gerencie programas de inicialização para um boot mais rápido.",
  },
]

export function FeaturesSection() {
  return (
    <section className="relative py-24 bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Recursos Poderosos
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty">
            Ferramentas profissionais para manter seu PC rodando no máximo desempenho.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
              
              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
