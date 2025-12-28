import { TrendingUp, Leaf, Users, Globe } from 'lucide-react';

export default function ImpactSection() {
  const stats = [
    {
      icon: TrendingUp,
      number: '2M+',
      label: 'Meals Tracked',
      unit: 'across our community',
    },
    {
      icon: Leaf,
      number: '450K',
      label: 'Food Waste Prevented',
      unit: 'kilos this year',
    },
    {
      icon: Users,
      number: '75K',
      label: 'Active Users',
      unit: 'making a difference',
    },
    {
      icon: Globe,
      number: '12K',
      label: 'Communities',
      unit: 'working together',
    },
  ]

  return (
    <section id="impact" className="relative py-20 md:py-32 bg-gradient-to-br from-[#2D5A27] to-[#1A3A17] overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#8FBC8F]/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 text-sm font-medium rounded-full mb-4">
            Our Impact
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance mb-4 text-white">
            Real Impact, Real Numbers
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            See the collective power of mindful consumption and sustainable practices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                <div className="w-12 h-12 mx-auto mb-4 bg-white/10 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#8FBC8F]" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-sm font-semibold text-white/90 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-white/60">
                  {stat.unit}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  )
}