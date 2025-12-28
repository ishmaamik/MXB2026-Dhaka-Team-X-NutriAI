import { useAuth } from '@clerk/clerk-react';
import { ArrowRight, Leaf, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const { isSignedIn } = useAuth();

  return (
    <section className="relative w-full pt-32 pb-16 md:pt-48 md:pb-24 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-[#A67B5B]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#2D5A27]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#FFF8DC]/30 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 w-fit px-4 py-2 bg-gradient-to-r from-[#2D5A27]/10 to-[#8FBC8F]/10 rounded-full border border-[#2D5A27]/20">
              <Sparkles className="w-4 h-4 text-[#2D5A27]" />
              <span className="text-sm font-medium text-[#2D5A27]">
                Join the Food Revolution
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
              Smart Food Management for a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D5A27] to-[#8FBC8F]">
                Healthier Future
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-foreground/70 leading-relaxed text-pretty max-w-lg">
              Track your food consumption, reduce waste, and build sustainable
              habits. Empower your household or community to make mindful
              choices about nutrition and responsible consumption.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={isSignedIn ? '/dashboard' : '/sign-in'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#A67B5B] to-[#8B5A3C] text-white rounded-xl hover:opacity-90 transition-smooth font-medium text-base shadow-lg shadow-[#A67B5B]/20"
              >
                {isSignedIn ? 'Go to Dashboard' : 'Start Free Today'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-secondary border border-[#E8DFD5] text-foreground rounded-xl hover:bg-[#FFF8DC] transition-smooth font-medium text-base"
              >
                Learn More
              </a>
            </div>

            {/* Feature highlights */}
            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2D5A27]/20 to-[#8FBC8F]/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-[#2D5A27]">✓</span>
                </div>
                <span className="text-sm text-foreground/80 font-medium">
                  Zero waste tracking
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2D5A27]/20 to-[#8FBC8F]/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-[#2D5A27]">✓</span>
                </div>
                <span className="text-sm text-foreground/80 font-medium">
                  Family & community
                </span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative w-full h-96 md:h-full min-h-96 bg-gradient-to-br from-[#FFF8DC] to-[#F5ECD9] rounded-3xl overflow-hidden flex items-center justify-center border border-[#E8DFD5] shadow-xl">
            <img
              src="/sustainability-hero.jpg"
              alt="Sustainable food management with recycling symbols and eco-friendly home"
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2D5A27]/20 to-transparent" />
            
            {/* Floating decorative element */}
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-[#E8DFD5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2D5A27] to-[#8FBC8F] rounded-xl flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Reduce Food Waste</p>
                  <p className="text-xs text-foreground/60">Save money & planet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
