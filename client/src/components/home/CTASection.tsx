import { useAuth } from '@clerk/clerk-react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  const { isSignedIn } = useAuth();

  return (
    <section className="relative py-20 md:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-center text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance mb-4">
            {isSignedIn
              ? 'Continue Your Journey'
              : 'Ready to Make a Difference?'}
          </h2>

          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            {isSignedIn
              ? 'Access your personalized dashboard and continue making a positive impact on food sustainability.'
              : 'Join thousands of households and communities already reducing waste and eating healthier. Start your free account today, no credit card required.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={isSignedIn ? '/dashboard' : '/sign-in'}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary-foreground text-primary rounded-lg hover:bg-opacity-90 transition-smooth font-semibold"
            >
              {isSignedIn ? 'Go to Dashboard' : 'Get Started Free'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary-foreground text-primary-foreground rounded-lg hover:bg-primary-foreground/10 transition-smooth font-semibold"
            >
              Explore Features
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
