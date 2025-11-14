import type { NextPage } from 'next'
import Head from 'next/head'
import Layout from '../components/Layout'
import Link from 'next/link'

const AboutPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>About - AgentTrace</title>
      </Head>
      <Layout title="About AgentTrace" subtitle="Why we built this tool and how to get the most value">
        <section className="mx-auto max-w-3xl space-y-6">
          <div className="card p-6">
            <p className="text-gray-700 mb-4">AgentTrace helps you visualize and debug AI agent execution by turning logs into interactive traces.</p>
            <p className="text-gray-600">Use the Dashboard to see recent traces and quick stats, the Traces page to browse the library, and the Upload page to ingest new traces.</p>
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Get Started</h2>
            <p className="text-gray-600">Ready to explore? Upload a sample or your own trace to inspect every step of your agent.</p>
            <Link className="btn-primary mt-4 inline-flex w-fit" href="/test">Upload a trace</Link>
          </div>
        </section>
      </Layout>
    </>
  )
}

export default AboutPage


