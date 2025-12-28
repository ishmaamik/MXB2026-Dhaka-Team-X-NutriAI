import { Apple, Leaf, BarChart3, Users, Zap, Target } from 'lucide-react'

const features = [
  {
    icon: Leaf,
    title: 'Smart Inventory',
    description: 'Track your food items in real-time with expiration alerts and usage history.',
    gradient: 'from-[#2D5A27] to-[#8FBC8F]',
    bgColor: 'bg-[#2D5A27]/10',
  },
  {
    icon: Apple,
    title: 'Health Insights',
    description: 'Monitor nutritional intake and build better eating habits for your household.',
    gradient: 'from-[#A67B5B] to-[#8B5A3C]',
    bgColor: 'bg-[#A67B5B]/10',
  },
  {
    icon: BarChart3,
    title: 'Usage Analytics',
    description: 'Visualize consumption patterns and identify opportunities to reduce waste.',
    gradient: 'from-[#2D5A27] to-[#8FBC8F]',
    bgColor: 'bg-[#2D5A27]/10',
  },
  {
    icon: Users,
    title: 'Community Sharing',
    description: 'Connect with others and share sustainable practices in your community.',
    gradient: 'from-[#A67B5B] to-[#8B5A3C]',
    bgColor: 'bg-[#A67B5B]/10',
  },
  {
    icon: Zap,
    title: 'Instant Logging',
    description: 'Quick and easy daily food logging with mobile-first interface.',
    gradient: 'from-[#2D5A27] to-[#8FBC8F]',
    bgColor: 'bg-[#2D5A27]/10',
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Set and achieve waste reduction and nutrition goals with your team.',
    gradient: 'from-[#A67B5B] to-[#8B5A3C]',
    bgColor: 'bg-[#A67B5B]/10',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-20 md:py-32 bg-gradient-to-b from-[#FFF8DC]/30 to-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <span className="inline-block px-4 py-1.5 bg-[#2D5A27]/10 text-[#2D5A27] text-sm font-medium rounded-full mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance mb-4">
            Powerful Features for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A67B5B] to-[#8B5A3C]">Real Impact</span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Everything you need to track consumption, reduce waste, and build sustainable food habits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group p-6 bg-card rounded-2xl border border-border hover:border-[#A67B5B]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#A67B5B]/5 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-5`}>
                  <Icon className={`w-7 h-7 text-transparent bg-clip-text bg-gradient-to-br ${feature.gradient}`} style={{ color: feature.gradient.includes('2D5A27') ? '#2D5A27' : '#A67B5B' }} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-foreground/60 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}