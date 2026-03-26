"use client"

import { useState } from "react"
import { Music, Theater, Trophy, Mic, Sparkles, Users } from "lucide-react"

const categories = [
  { name: "Conciertos", icon: Music, count: 45 },
  { name: "Teatro", icon: Theater, count: 23 },
  { name: "Deportes", icon: Trophy, count: 18 },
  { name: "Conferencias", icon: Mic, count: 12 },
  { name: "Festivales", icon: Sparkles, count: 8 },
  { name: "Eventos Sociales", icon: Users, count: 15 },
]

export function CategoryChips() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <section className="container mx-auto px-4">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Explora por Categoría</h2>
          <p className="text-muted-foreground">Encuentra exactamente lo que buscas</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.name

            return (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(isSelected ? null : category.name)}
                className={`flex items-center gap-2 px-4 py-3 rounded-full border-2 transition-all hover:scale-105 ${
                  isSelected
                    ? "!bg-green-600 !text-white !border-green-600"
                    : "!bg-white !text-gray-800 !border-gray-300 hover:!border-green-500 hover:!bg-gray-50"
                }`}
                style={{
                  backgroundColor: isSelected ? "#059669 !important" : "#ffffff !important",
                  color: isSelected ? "#ffffff !important" : "#1f2937 !important",
                  borderColor: isSelected ? "#059669 !important" : "#d1d5db !important",
                }}
              >
                <Icon className="h-4 w-4" style={{ color: isSelected ? "#ffffff !important" : "#1f2937 !important" }} />
                <span
                  className={`font-medium ${isSelected ? "!text-white" : "!text-gray-800"}`}
                  style={{
                    color: isSelected ? "#ffffff !important" : "#1f2937 !important",
                    backgroundColor: "transparent !important",
                  }}
                >
                  {category.name}
                </span>
                <span
                  className="ml-1 px-2 py-1 text-xs rounded-full"
                  style={{
                    backgroundColor: isSelected ? "rgba(255,255,255,0.2) !important" : "#f3f4f6 !important",
                    color: isSelected ? "#ffffff !important" : "#374151 !important",
                  }}
                >
                  {category.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
