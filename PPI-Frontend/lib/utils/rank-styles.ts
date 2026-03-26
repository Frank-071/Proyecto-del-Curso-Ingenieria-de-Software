export const getRankStyles = (rank: string): string => {
  const styles = {
    bronce: "bg-gradient-to-r from-orange-500 via-orange-600 to-amber-700 text-white border-2 border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.5)] ring-2 ring-orange-300/50",
    plata: "bg-gradient-to-r from-gray-300 via-slate-200 to-gray-400 text-gray-900 border-2 border-gray-300 shadow-[0_0_15px_rgba(203,213,225,0.7)] ring-2 ring-slate-300/60",
    oro: "bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-400 text-gray-900 border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)] ring-2 ring-yellow-400/50",
    platino: "bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500 text-white border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] ring-2 ring-cyan-300/50"
  }
  return styles[rank as keyof typeof styles] || styles.bronce
}

export const getAvatarStyles = (rank: string): string => {
  const styles = {
    bronce: "bg-gradient-to-br from-orange-500 to-amber-600 ring-4 ring-orange-300",
    plata: "bg-gradient-to-br from-slate-400 to-gray-500 ring-4 ring-slate-300",
    oro: "bg-gradient-to-br from-yellow-400 to-yellow-600 ring-4 ring-yellow-300",
    platino: "bg-gradient-to-br from-cyan-400 to-blue-500 ring-4 ring-cyan-300"
  }
  return styles[rank as keyof typeof styles] || styles.bronce
}

