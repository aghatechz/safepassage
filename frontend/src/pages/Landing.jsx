import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search, Map, AlertTriangle, CheckCircle2, Users, ArrowRight, ChevronRight, Globe, FileText, ThumbsUp } from 'lucide-react';

export default function Landing() {

  const features = [
    {
      icon: Search,
      title: 'Search & Verify',
      desc: 'Look up any recruitment agency by name or location to view their trust score, past reports, and community ratings.',
      color: 'text-teal-600 bg-teal-50',
    },
    {
      icon: AlertTriangle,
      title: 'Report a Scam',
      desc: 'Submit detailed scam reports with evidence. Our red-flag detector automatically scans for common fraud patterns.',
      color: 'text-red-600 bg-red-50',
    },
    {
      icon: ThumbsUp,
      title: 'Community Voting',
      desc: 'Upvote or downvote reports to help establish credibility. The community polices itself to keep information accurate.',
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: Map,
      title: 'Region Heatmap',
      desc: 'View which regions have the highest scam density. Visual geographic data helps spot fraud hotspots.',
      color: 'text-amber-600 bg-amber-50',
    },
    {
      icon: CheckCircle2,
      title: 'Verified Agencies',
      desc: 'Admins manually verify legitimate recruitment agencies and award them a "Trusted" badge for transparency.',
      color: 'text-teal-600 bg-teal-50',
    },
    {
      icon: Shield,
      title: 'Fraud Protection',
      desc: 'Get alerted about common scam phrases like "pay before visa" and "no written contract" before you apply.',
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Lives Protected', icon: Users },
    { value: '500+', label: 'Agencies Listed', icon: Globe },
    { value: '1,200+', label: 'Scam Reports', icon: FileText },
    { value: '85%', label: 'Detection Rate', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-teal-50/50"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-100/30 to-transparent"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32 lg:pb-36">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1.5 text-sm font-semibold text-teal-800 mb-6 shadow-sm">
              <Shield className="h-4 w-4" />
              Crowd-Sourced Overseas Job Scam Verification
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Verify Before You Apply.{' '}
              <span className="text-teal-600">Stay Safe.</span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
              Trillions of job seekers from South & Southeast Asia fall victim to fake overseas job scams every year.
              SafePassage helps you verify recruitment agencies, report fraud, and protect others from being scammed.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-teal-200 hover:bg-teal-700 hover:shadow-teal-300 transition-all"
              >
                Get Started Free <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-8 py-3.5 text-base font-bold text-slate-700 hover:border-teal-400 hover:text-teal-600 transition-all"
              >
                Sign In
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Free to use</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Anonymous reports</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Community driven</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">How SafePassage Works</h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              Everything you need to verify job offers and expose recruitment fraud.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="card-hover p-6">
                <div className={`h-12 w-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Start Protecting Yourself Today</h2>
          <p className="mt-4 text-lg text-teal-100 max-w-2xl mx-auto">
            Join thousands of job seekers who use SafePassage to verify recruitment agencies 
            and avoid overseas job scams.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-teal-700 shadow-lg hover:bg-teal-50 transition-all"
            >
              Create Free Account <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-teal-400 px-8 py-3.5 text-base font-bold text-white hover:bg-teal-600 transition-all"
            >
              Sign In <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
