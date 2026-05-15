import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[288px] min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-6 lg:p-8 pt-2">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
