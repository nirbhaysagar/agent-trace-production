import Sidebar from './Sidebar'
import TopNav from './TopNav'
import { ReactNode } from 'react'
import GlobalSearch from './GlobalSearch'

interface LayoutProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export default function Layout({ title, subtitle, actions, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 md:flex md:gap-6">
        <aside className="hidden md:flex md:w-60">
          <Sidebar />
        </aside>

        <div className="flex-1 min-w-0">
          <div className="md:hidden mb-4">
            <TopNav />
          </div>

          {(title || actions) && (
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                {title && <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700 }}>{title}</h1>}
                {subtitle && <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{subtitle}</p>}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <GlobalSearch />
                {actions && <div className="flex items-center gap-3">{actions}</div>}
              </div>
            </div>
          )}

          <div className="space-y-6 pb-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}


