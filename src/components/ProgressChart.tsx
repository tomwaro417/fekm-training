'use client'

interface ProgressChartProps {
  data: Array<{
    name: string
    mastered: number
    total: number
    color: string
  }>
}

export function ProgressChart({ data }: ProgressChartProps) {
  return (
    <div className="space-y-4">
      {data.map((item) => {
        const percentage = item.total > 0 ? (item.mastered / item.total) * 100 : 0
        
        return (
          <div key={item.name}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{item.name}</span>
              <span className="text-gray-500">
                {item.mastered}/{item.total} ({Math.round(percentage)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
