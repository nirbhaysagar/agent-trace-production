import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'
import { Zap, Code, Search, Share2, BarChart3, Play, ArrowRight, Sparkles, Terminal, Network, CheckCircle, Star, Upload, Filter, Eye, TrendingUp, Users, Shield, Brain, Layers, Rocket, Coins, Key, AlertCircle, CheckCircle2, XCircle, Clock, GitBranch, FileText, Lock, Globe, Sparkles as SparklesIcon } from 'lucide-react'

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Head>
        <title>AgentTrace - Postman for AI Agents</title>
        <meta name="description" content="Debug, visualize, and understand your AI agent execution traces. The Postman for AI agents." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800;900&family=Instrument+Serif:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />
      </Head>

      {/* Header - Elegant Minimal */}
      <header className="relative z-50 bg-black border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <span className="text-base font-normal text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 400 }}>agenttrace</span>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Features</Link>
              <Link href="#community" className="text-sm text-gray-400 hover:text-white transition-colors" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Community</Link>
              <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>About</Link>
              <Link href="#whitepaper" className="text-sm text-gray-400 hover:text-white transition-colors" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Whitepaper</Link>
              <Link 
                href={{ pathname: '/login', query: { mode: 'signup' } }}
                className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded hover:border-white/20"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                Register
              </Link>
              <Link 
                href={{ pathname: '/login', query: { mode: 'signin', redirect: '/dashboard' } }}
                className="text-sm bg-white text-black px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Enhanced with Designs & Logos */}
      <main className="relative bg-black overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient Orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          {/* Main Hero Content */}
          <div className="max-w-6xl mx-auto">
            {/* Badge */}
            <div className="mb-8">
              <span className="inline-flex items-center space-x-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                <Zap className="w-3 h-3 text-orange-400" />
                <span>Postman for AI Agents</span>
              </span>
            </div>

            {/* Large Serif Headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-normal mb-8 leading-[1.05]" style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
              <span className="text-white">
                Debug AI agents
              </span>
              <br />
              <span className="text-white/90">
                with precision and clarity
              </span>
            </h1>
            
            {/* Subheadline - Improved Typography & Placement */}
            <div className="max-w-3xl mb-12">
              <p className="text-xl md:text-2xl text-gray-200 leading-relaxed mb-4 font-light" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 300, letterSpacing: '-0.01em' }}>
                Transform complex agent execution logs into beautiful, interactive visualizations. 
                See every thought, action, and error in an elegant timeline that makes debugging effortless.
              </p>
              <p className="text-base md:text-lg text-gray-400 leading-relaxed font-light" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 300, letterSpacing: '-0.005em' }}>
                Upload-free debugging tools compatible with all AI frameworks, cloud platforms, and agent libraries. 
                No setup required—just paste your trace and watch the magic happen.
              </p>
            </div>

            {/* CTA Button */}
            <div className="mb-8">
              <Link 
                href="/test"
                className="inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl"
                style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600 }}
              >
                <span>Start debugging now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-3 text-gray-400 mb-20">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 border-2 border-black"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 border-2 border-black"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 border-2 border-black"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 border-2 border-black"></div>
              </div>
              <span className="text-sm" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Currently used by 100+ developers</span>
            </div>
          </div>

          {/* Compatible Tools - With Logo Placeholders */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/5">
            <p className="text-center text-xs text-gray-500 mb-12 uppercase tracking-wider" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>Compatible with</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center justify-items-center">
              {[
                { name: 'OpenAI', color: 'from-green-500 to-emerald-600' },
                { name: 'Anthropic', color: 'from-orange-500 to-red-600' },
                { name: 'LangChain', color: 'from-blue-500 to-cyan-600' },
                { name: 'LlamaIndex', color: 'from-purple-500 to-pink-600' },
                { name: 'AutoGPT', color: 'from-yellow-500 to-orange-600' },
                { name: 'BabyAGI', color: 'from-pink-500 to-rose-600' },
                { name: 'CrewAI', color: 'from-indigo-500 to-blue-600' },
                { name: 'AutoGen', color: 'from-teal-500 to-cyan-600' },
              ].map((tool, i) => (
                <div key={i} className="flex flex-col items-center space-y-3 group cursor-pointer">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <span className="text-white font-bold text-xs">{tool.name.charAt(0)}</span>
                  </div>
                  <span className="text-gray-400 text-xs font-medium text-center group-hover:text-white transition-colors" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {tool.name}
                  </span>
                </div>
              ))}
                        </div>
                      </div>
                    </div>
                    
        {/* Colorful Abstract Design - Enhanced Light Trails */}
        <div className="relative w-full h-48 overflow-hidden mt-8">
          <div className="absolute inset-0">
            <svg className="w-full h-full" viewBox="0 0 1200 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#ec4899" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <path d="M0,150 Q300,80 600,150 T1200,150" stroke="url(#gradient1)" strokeWidth="2.5" fill="none" opacity="0.8" />
              <path d="M0,180 Q400,100 800,180 T1200,180" stroke="url(#gradient2)" strokeWidth="2.5" fill="none" opacity="0.7" />
              <path d="M0,120 Q200,50 400,120 T800,120 T1200,120" stroke="url(#gradient3)" strokeWidth="2.5" fill="none" opacity="0.6" />
              <path d="M0,210 Q500,130 1000,210 T1200,210" stroke="url(#gradient4)" strokeWidth="2" fill="none" opacity="0.5" />
            </svg>
          </div>
        </div>
      </main>

      {/* Who This Tool Is For Section */}
      <section className="relative z-10 py-24 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
              Who this tool is for
            </h2>
            <p className="text-base text-gray-400 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Built for developers, teams, and organizations working with AI agents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Code className="w-6 h-6" />,
                title: 'AI Developers',
                description: 'Build and debug AI agents with confidence. See exactly what your agent is thinking and doing at every step. Perfect for developers working with LangChain, AutoGPT, or custom agent frameworks.',
                gradient: 'from-blue-500/10 to-cyan-500/10',
                borderColor: 'border-blue-500/10',
                iconColor: 'text-blue-400',
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Engineering Teams',
                description: 'Collaborate on agent debugging with your team. Share traces, compare runs, and debug together. Ideal for teams shipping production AI applications that need reliable observability.',
                gradient: 'from-purple-500/10 to-pink-500/10',
                borderColor: 'border-purple-500/10',
                iconColor: 'text-purple-400',
              },
              {
                icon: <Rocket className="w-6 h-6" />,
                title: 'AI Startups & Companies',
                description: 'Scale your AI agent infrastructure with proper debugging tools. Track performance, identify bottlenecks, and optimize costs. Essential for companies building AI-powered products.',
                gradient: 'from-orange-500/10 to-red-500/10',
                borderColor: 'border-orange-500/10',
                iconColor: 'text-orange-400',
              },
              {
                icon: <Brain className="w-6 h-6" />,
                title: 'Researchers & ML Engineers',
                description: 'Analyze agent behavior patterns, token usage, and performance metrics. Perfect for researchers studying agent capabilities and ML engineers optimizing model interactions.',
                gradient: 'from-green-500/10 to-emerald-500/10',
                borderColor: 'border-green-500/10',
                iconColor: 'text-green-400',
              },
              {
                icon: <Terminal className="w-6 h-6" />,
                title: 'DevOps & SRE Teams',
                description: 'Monitor agent health, track errors, and ensure reliability. Integrate with your CI/CD pipeline for automated trace analysis and regression detection.',
                gradient: 'from-yellow-500/10 to-orange-500/10',
                borderColor: 'border-yellow-500/10',
                iconColor: 'text-yellow-400',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'Enterprise Teams',
                description: 'Enterprise-grade security and compliance. Private trace storage, role-based access, and full audit trails. Built for organizations with strict data governance requirements.',
                gradient: 'from-gray-500/10 to-slate-500/10',
                borderColor: 'border-gray-500/10',
                iconColor: 'text-gray-400',
              },
            ].map((item, index) => (
              <div key={index} className={`bg-black rounded-xl border ${item.borderColor} p-6 hover:border-opacity-30 transition-all group`}>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center ${item.iconColor} mb-4 group-hover:scale-105 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600 }}>
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="relative z-10 py-24 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
              See the transformation
            </h2>
            <p className="text-base text-gray-400 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              From messy JSON logs to beautiful, interactive visualizations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Before */}
            <div className="bg-[#0a0a0a] rounded-xl border border-white/5 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <XCircle className="w-5 h-5 text-red-400/60" />
                <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600 }}>Before AgentTrace</h3>
                </div>
              <div className="bg-black rounded-lg p-6 border border-white/5 font-mono text-xs text-gray-500 overflow-x-auto">
                <pre className="whitespace-pre-wrap">
{`{
  "steps": [
    {
      "type": "thought",
      "content": "I need to...",
      "timestamp": "2024-01-01T12:00:00Z"
    },
    {
      "type": "action",
      "content": "Calling API...",
      "error": "404 Not Found"
    }
  ]
}`}
                </pre>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-500">
                <li className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-400/50" />
                  <span>Raw JSON logs are hard to read</span>
                      </li>
                <li className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-400/50" />
                  <span>No visual timeline or context</span>
                      </li>
                <li className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-400/50" />
                  <span>Errors buried in nested data</span>
                      </li>
                  </ul>
            </div>

            {/* After */}
            <div className="bg-[#0a0a0a] rounded-xl border border-green-500/20 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-400/70" />
                <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600 }}>After AgentTrace</h3>
              </div>
              <div className="bg-black rounded-lg p-6 border border-white/5">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs text-blue-400 font-medium">Thought</span>
                        <span className="text-xs text-gray-500">• 120ms</span>
                </div>
                      <p className="text-sm text-gray-300">I need to analyze the user's request...</p>
              </div>
                </div>
                  <div className="flex items-center space-x-3 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs text-red-400 font-medium">Action</span>
                        <span className="text-xs text-gray-500">• 2.0s</span>
                </div>
                      <p className="text-sm text-gray-300">API call failed: 404 Not Found</p>
                      <p className="text-xs text-red-400/80 mt-1">Error: User does not exist</p>
                </div>
                </div>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400/70" />
                  <span>Interactive timeline visualization</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400/70" />
                  <span>Color-coded step types and errors</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400/70" />
                  <span>One-click error analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Elegant Cards */}
      <section id="features" className="relative z-10 py-32 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-normal mb-4" style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
              Everything you need
            </h2>
            <p className="text-base text-gray-400 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              Powerful debugging tools designed for modern AI development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Eye className="w-5 h-5" />,
                title: 'Visual Timeline',
                description: 'See every step of your agent\'s execution in an interactive timeline. Track thoughts, actions, and observations with beautiful visualizations.',
                gradient: 'from-blue-500/10 to-cyan-500/10',
                borderColor: 'border-blue-500/10',
                iconColor: 'text-blue-400',
              },
              {
                icon: <Search className="w-5 h-5" />,
                title: 'Smart Search',
                description: 'Find specific steps, errors, or content instantly. Filter by type, duration, or errors. Global search across all your traces.',
                gradient: 'from-purple-500/10 to-pink-500/10',
                borderColor: 'border-purple-500/10',
                iconColor: 'text-purple-400',
              },
              {
                icon: <GitBranch className="w-5 h-5" />,
                title: 'Trace Comparison',
                description: 'Side-by-side comparison of different agent runs. Perfect for A/B testing, debugging regressions, and performance analysis.',
                gradient: 'from-green-500/10 to-emerald-500/10',
                borderColor: 'border-green-500/10',
                iconColor: 'text-green-400',
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                title: 'Performance Insights',
                description: 'Track duration, token usage, and error rates. Optimize your agents with data-driven insights and comprehensive analytics.',
                gradient: 'from-orange-500/10 to-red-500/10',
                borderColor: 'border-orange-500/10',
                iconColor: 'text-orange-400',
              },
              {
                icon: <SparklesIcon className="w-5 h-5" />,
                title: 'AI-Powered Analysis',
                description: 'Get instant error summaries, root cause analysis, and suggested fixes. AI copilot helps you debug faster and smarter.',
                gradient: 'from-pink-500/10 to-rose-500/10',
                borderColor: 'border-pink-500/10',
                iconColor: 'text-pink-400',
              },
              {
                icon: <Lock className="w-5 h-5" />,
                title: 'Private Storage',
                description: 'Upload traces privately with full control over visibility. Private vaults, secure authentication, and complete data ownership.',
                gradient: 'from-gray-500/10 to-slate-500/10',
                borderColor: 'border-gray-500/10',
                iconColor: 'text-gray-400',
              },
              {
                icon: <Share2 className="w-5 h-5" />,
                title: 'Share & Collaborate',
                description: 'Share trace URLs with your team. Public and private visibility controls. Debug together, just like sharing Postman collections.',
                gradient: 'from-cyan-500/10 to-blue-500/10',
                borderColor: 'border-cyan-500/10',
                iconColor: 'text-cyan-400',
              },
              {
                icon: <Terminal className="w-5 h-5" />,
                title: 'Easy Integration',
                description: 'Use our SDKs for Python or TypeScript. Add a few lines of code and start tracing. REST API for custom integrations.',
                gradient: 'from-yellow-500/10 to-orange-500/10',
                borderColor: 'border-yellow-500/10',
                iconColor: 'text-yellow-400',
              },
              {
                icon: <Globe className="w-5 h-5" />,
                title: 'Framework Agnostic',
                description: 'Works with OpenAI, Anthropic, LangChain, LlamaIndex, and any custom framework. No vendor lock-in, complete freedom.',
                gradient: 'from-indigo-500/10 to-purple-500/10',
                borderColor: 'border-indigo-500/10',
                iconColor: 'text-indigo-400',
              },
            ].map((feature, index) => (
              <div key={index} className={`bg-black rounded-xl border ${feature.borderColor} p-6 hover:border-opacity-30 transition-all group`}>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center ${feature.iconColor} mb-4 group-hover:scale-105 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600 }}>
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Unique Section */}
      <section className="relative z-10 py-24 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-16">
            {/* Left: Large Serif Headline */}
            <div>
              <h2 className="text-5xl md:text-6xl font-normal leading-tight" style={{ fontFamily: 'Instrument Serif, serif', fontWeight: 400 }}>
                What makes us unique
              </h2>
            </div>

            {/* Right: Developer Benefits */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600 }}>
                Developer Benefits
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                Our tool offers a seamless integration of advanced debugging strategies and user-friendly visualization tools, designed to maximize your agent's performance potential effortlessly. We provide personalized support, cutting-edge analytics, and a community of like-minded developers to ensure your success.
              </p>
            </div>
          </div>

          {/* Feature Cards - 4 Cards in a Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                number: '01',
                icon: <Zap className="w-5 h-5" />,
                title: 'Fairest pricing just $9-59',
                description: 'Start with a $9 weekly trial or unlock lifetime Pro for $59. No recurring fees, no hidden costs. Keep debugging without subscription headaches.',
                gradient: 'from-green-500/20 via-blue-500/20 to-pink-500/20',
                iconBg: 'from-green-500/30 to-blue-500/30',
                borderColor: 'border-green-500/10',
              },
              {
                number: '02',
                icon: <Rocket className="w-5 h-5" />,
                title: 'Framework Freedom',
                description: 'Ditch your dependence on a single platform. Your agent traces work everywhere—OpenAI, Anthropic, LangChain, or custom frameworks.',
                gradient: 'from-purple-500/20 via-blue-500/20 to-cyan-500/20',
                iconBg: 'from-purple-500/30 to-blue-500/30',
                borderColor: 'border-purple-500/10',
              },
              {
                number: '03',
                icon: <Shield className="w-5 h-5" />,
                title: 'Security—Retain ownership always',
                description: 'No anonymous users + No selling trace data. Your agent execution logs are safe on AgentTrace. Full control over public/private visibility.',
                gradient: 'from-gray-400/20 via-gray-500/20 to-gray-600/20',
                iconBg: 'from-gray-400/30 to-gray-500/30',
                borderColor: 'border-gray-500/10',
              },
              {
                number: '04',
                icon: <Users className="w-5 h-5" />,
                title: 'Community Investment',
                description: 'AgentTrace donates a portion of fees to the Developer Community Fund, whose allocation is governed by the Creator Advisory Board.',
                gradient: 'from-green-500/20 via-emerald-500/20 to-teal-500/20',
                iconBg: 'from-green-500/30 to-emerald-500/30',
                borderColor: 'border-emerald-500/10',
              },
            ].map((feature, index) => (
              <div key={index} className={`bg-black rounded-xl border ${feature.borderColor} p-6 hover:border-opacity-30 transition-all group`}>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-2xl font-bold text-white/8" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 800 }}>
                    {feature.number}
                  </span>
                  <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${feature.iconBg} flex items-center justify-center text-white/60 group-hover:text-white/80 transition-colors`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-base font-semibold mb-3 text-white leading-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600 }}>
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-white"></div>
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <span className="text-base font-normal text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 400 }}>agenttrace</span>
            </div>
            <p className="text-gray-400 text-xs" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>© 2025 AgentTrace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
