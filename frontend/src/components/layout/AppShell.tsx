import { type ReactNode } from 'react'
import TopBar from './TopBar'
import LeftPane from './LeftPane'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftPane />
        <main className="flex-1 overflow-hidden bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
