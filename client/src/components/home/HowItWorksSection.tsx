const steps = [
  {
    number: '01',
    title: 'Create Your Profile',
    description: 'Set up your household or community profile with dietary preferences and goals.',
  },
  {
    number: '02',
    title: 'Log Your Food',
    description: 'Easily add items to your inventory as you shop or consume food.',
  },
  {
    number: '03',
    title: 'Track & Reduce',
    description: 'Monitor consumption patterns and get insights to reduce waste.',
  },
  {
    number: '04',
    title: 'Make Impact',
    description: 'Achieve your goals and contribute to a more sustainable future.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <span className="inline-block px-4 py-1.5 bg-[#A67B5B]/10 text-[#A67B5B] text-sm font-medium rounded-full mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance mb-4">
            Get Started in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D5A27] to-[#8FBC8F]">Four Simple Steps</span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Get started in four simple steps and begin your journey to sustainable food management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#A67B5B] to-[#8B5A3C] rounded-2xl flex items-center justify-center shadow-lg shadow-[#A67B5B]/20">
                    <span className="text-xl font-bold text-white">{step.number}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute left-20 top-8 w-[calc(100%-5rem)] h-0.5 bg-gradient-to-r from-[#E8DFD5] to-transparent" />
                  )}
                </div>

                <div className="pt-2">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-foreground/60 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}