import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'

export default function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
