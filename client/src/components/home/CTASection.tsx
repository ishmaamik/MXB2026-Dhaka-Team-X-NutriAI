import { useAuth } from '@clerk/clerk-react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  const { isSignedIn } = useAuth();

  return (
    <section className="relative py-20 md:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#A67B5B] via-[#8B5A3C] to-[#7A4A2C] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFF8DC]/10 rounded-full blur-3xl" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Start Your Journey</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance mb-4">
            {isSignedIn
              ? 'Continue Your Journey'
              : 'Ready to Make a Difference?'}
          </h2>

          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            {isSignedIn
              ? 'Access your personalized dashboard and continue making a positive impact on food sustainability.'
              : 'Join thousands of households and communities already reducing waste and eating healthier. Start your free account today, no credit card required.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={isSignedIn ? '/dashboard' : '/sign-in'}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#8B5A3C] rounded-xl hover:bg-[#FFF8DC] transition-smooth font-semibold shadow-lg"
            >
              {isSignedIn ? 'Go to Dashboard' : 'Get Started Free'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white rounded-xl hover:bg-white/10 transition-smooth font-semibold"
            >
              Explore Features
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
