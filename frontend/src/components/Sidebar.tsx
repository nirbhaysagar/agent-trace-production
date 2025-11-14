import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, Layers, Upload, Settings, Info, Activity, Sparkles, DollarSign, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/traces', label: 'Traces', icon: Layers },
  { href: '/test', label: 'Upload', icon: Upload },
  { href: '/compare', label: 'Compare', icon: Activity },
  { href: '/pricing', label: 'Pricing', icon: DollarSign },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/about', label: 'About', icon: Info },
]

export default function Sidebar() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      await router.push('/')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className="sticky top-6 h-[calc(100vh-3rem)] w-full">
      <div className="flex h-full flex-col rounded-3xl bg-black text-white shadow-2xl">
        <div className="flex h-16 items-center justify-center border-b border-white/10 px-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 font-semibold">F</div>
            <span className="text-sm font-semibold tracking-wide">AgentTrace</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = router.pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center space-x-3 rounded-xl px-3 py-2 text-sm transition-all ${
                  active ? 'bg-white text-black shadow-sm' : 'hover:bg-white/10'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-black' : 'text-white'}`} />
                <span className="hidden lg:inline font-medium">{label}</span>
              </Link>
            )
          })}
          {user && (
            <Link
              href="/ai-analysis"
              className={`group flex items-center space-x-3 rounded-xl px-3 py-2 text-sm transition-all ${
                router.pathname === '/ai-analysis' ? 'bg-white text-black shadow-sm' : 'hover:bg-white/10'
              }`}
            >
              <Sparkles className={`h-5 w-5 ${router.pathname === '/ai-analysis' ? 'text-black' : 'text-white'}`} />
              <span className="hidden lg:inline font-medium">AI Analysis</span>
            </Link>
          )}
        </nav>

        {user && (
          <div className="px-3 pb-3 border-t border-white/10 pt-3">
            <button
              onClick={handleSignOut}
              className="group flex items-center space-x-3 rounded-xl px-3 py-2 text-sm transition-all w-full hover:bg-white/10 text-white"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden lg:inline font-medium">Sign Out</span>
            </button>
          </div>
        )}

        <div className="px-3 pb-4 text-xs text-white/50">© {new Date().getFullYear()}</div>
      </div>
    </div>
  )
}


