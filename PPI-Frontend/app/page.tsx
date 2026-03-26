import { Header } from "@/components/header"
import { HomeContent } from "@/components/home-content"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HomeContent />
    </div>
  )
}
