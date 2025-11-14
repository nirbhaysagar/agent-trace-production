import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import TopNav from '../components/TopNav'

const NotFoundPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Not Found - AgentTrace</title>
      </Head>
      <TopNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-8">The page you are looking for doesn’t exist or has been moved.</p>
        <div className="flex justify-center space-x-3">
          <Link href="/dashboard" className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Go to Dashboard</Link>
          <Link href="/test" className="px-5 py-2.5 border rounded-lg hover:bg-gray-50">Upload Trace</Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage


