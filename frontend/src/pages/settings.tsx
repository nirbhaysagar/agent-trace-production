import type { NextPage } from 'next'
import Head from 'next/head'
import Layout from '../components/Layout'
import Link from 'next/link'
import { CreditCard, User, Bell, Shield, Mail, Save, Download, Trash2, AlertCircle, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import supabase from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router'

const SettingsPage: NextPage = () => {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    avatarUrl: '',
  })
  const [notifications, setNotifications] = useState({
    emailErrors: true,
    emailWeekly: false,
    emailTraceAlerts: true,
  })
  const [operationLoading, setOperationLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
        avatarUrl: user.user_metadata?.avatar_url || '',
      })
      
      // Load notification preferences from user metadata
      if (user.user_metadata?.notifications) {
        setNotifications({
          emailErrors: user.user_metadata.notifications.emailErrors ?? true,
          emailWeekly: user.user_metadata.notifications.emailWeekly ?? false,
          emailTraceAlerts: user.user_metadata.notifications.emailTraceAlerts ?? true,
        })
      }
    }
  }, [user])

  const handleUpdateProfile = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.displayName,
          name: profileData.displayName,
        },
      })

      if (error) throw error

      toast.success('Profile updated successfully')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateNotifications = async () => {
    setSaving(true)
    try {
      // Store notification preferences in user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          notifications: notifications,
        },
      })

      if (error) throw error

      toast.success('Notification preferences saved')
    } catch (error: any) {
      console.error('Error updating notifications:', error)
      toast.error(error.message || 'Failed to update notifications')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return

    setSaving(true)
    try {
      // Note: Supabase doesn't support changing password via updateUser
      // This would require a password reset flow or re-authentication
      toast.error('Password change requires re-authentication. Please use "Forgot Password" to reset.')
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast.error(error.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    if (!user) return

    setOperationLoading(true)
    try {
      // Fetch user's traces
      const { data: traces, error } = await supabase
        .from('traces')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      // Create export data
      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        traces: traces || [],
        exported_at: new Date().toISOString(),
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `agenttrace-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Data exported successfully')
    } catch (error: any) {
      console.error('Error exporting data:', error)
      toast.error(error.message || 'Failed to export data')
    } finally {
      setOperationLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return

    setOperationLoading(true)
    try {
      // Delete user's traces first
      const { error: tracesError } = await supabase
        .from('traces')
        .delete()
        .eq('user_id', user.id)

      if (tracesError) throw tracesError

      // Delete user's saved filters
      const { error: filtersError } = await supabase
        .from('saved_filters')
        .delete()
        .eq('user_id', user.id)

      if (filtersError) throw filtersError

      // Delete user account (this requires admin privileges or user deletion endpoint)
      toast.error('Account deletion requires admin action. Please contact support.')
    } catch (error: any) {
      console.error('Error deleting account:', error)
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setOperationLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Layout title="Settings">
        <div className="card p-8 text-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </Layout>
    )
  }

  // Show sign in required only after loading is complete and user is not authenticated
  if (!user) {
    return (
      <Layout title="Settings">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access settings.</p>
          <Link href="/login?mode=signin" className="btn-primary">
            Sign In
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <>
      <Head>
        <title>Settings - AgentTrace</title>
      </Head>
      <Layout title="Settings" subtitle="Manage your preferences">
        <div className="space-y-4">
          {/* Subscription Section */}
          <Link
            href="/settings/subscription"
            className="card p-6 block hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
                <p className="text-sm text-gray-600">Manage your plan and billing</p>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </Link>

          {/* Profile Section */}
          <div className="card p-6">
            <div 
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => setActiveSection(activeSection === 'profile' ? null : 'profile')}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                  <p className="text-sm text-gray-600">Manage your account information</p>
                </div>
              </div>
              <span className="text-gray-400">{activeSection === 'profile' ? '▼' : '▶'}</span>
            </div>

            {activeSection === 'profile' && (
              <div className="mt-6 space-y-4 border-t pt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your display name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed here</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={profileData.avatarUrl}
                    onChange={(e) => setProfileData({ ...profileData, avatarUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications Section */}
          <div className="card p-6">
            <div 
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => setActiveSection(activeSection === 'notifications' ? null : 'notifications')}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <Bell className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-600">Configure your notification preferences</p>
                </div>
              </div>
              <span className="text-gray-400">{activeSection === 'notifications' ? '▼' : '▶'}</span>
            </div>

            {activeSection === 'notifications' && (
              <div className="mt-6 space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-900">Error Notifications</label>
                      <p className="text-xs text-gray-500">Get notified when errors occur in your traces</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailErrors}
                      onChange={(e) => setNotifications({ ...notifications, emailErrors: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-900">Trace Alerts</label>
                      <p className="text-xs text-gray-500">Receive alerts for important trace events</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailTraceAlerts}
                      onChange={(e) => setNotifications({ ...notifications, emailTraceAlerts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <label className="text-sm font-medium text-gray-900">Weekly Summary</label>
                      <p className="text-xs text-gray-500">Receive a weekly summary of your activity</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailWeekly}
                      onChange={(e) => setNotifications({ ...notifications, emailWeekly: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <button
                  onClick={handleUpdateNotifications}
                  disabled={saving}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Privacy & Security Section */}
          <div className="card p-6">
            <div 
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => setActiveSection(activeSection === 'security' ? null : 'security')}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Privacy & Security</h3>
                  <p className="text-sm text-gray-600">Manage your security and privacy settings</p>
                </div>
              </div>
              <span className="text-gray-400">{activeSection === 'security' ? '▼' : '▶'}</span>
            </div>

            {activeSection === 'security' && (
              <div className="mt-6 space-y-4 border-t pt-6">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-amber-900">Password Management</h4>
                      <p className="text-xs text-amber-700 mt-1">
                        To change your password, please use the "Forgot Password" option on the sign-in page.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Export Data</h4>
                      <p className="text-xs text-gray-500">Download all your data as JSON</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExportData}
                    disabled={operationLoading}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {operationLoading ? 'Exporting...' : 'Export'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
                      <p className="text-xs text-red-700">Permanently delete your account and all data</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={operationLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {operationLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <LogOut className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Sign Out</h4>
                      <p className="text-xs text-gray-500">Sign out of your account</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await signOut()
                        toast.success('Signed out successfully')
                        await router.push('/')
                      } catch (error: any) {
                        console.error('Sign out error:', error)
                        toast.error('Failed to sign out')
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  )
}

export default SettingsPage
