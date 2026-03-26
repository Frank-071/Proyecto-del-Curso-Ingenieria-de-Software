import { Header } from "@/components/header"
import { AdminDashboard } from "./components/AdminDashboard"

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <AdminDashboard />
    </div>
  )
}
