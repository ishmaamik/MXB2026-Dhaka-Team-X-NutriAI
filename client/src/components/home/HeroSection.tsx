import { useAuth } from '@clerk/clerk-react';
import { ArrowRight, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const { isSignedIn } = useAuth();

  return (
    <section className="relative w-full pt-32 pb-16 md:pt-48 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 w-fit px-4 py-2 bg-primary/10 rounded-full">
              <Leaf className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Join the Food Revolution
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
              Smart Food Management for a{' '}
              <span className="text-primary">Healthier Future</span>
            </h1>

            <p className="text-lg text-foreground/70 leading-relaxed text-pretty max-w-lg">
              Track your food consumption, reduce waste, and build sustainable
              habits. Empower your household or community to make mindful
              choices about nutrition and responsible consumption.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to={isSignedIn ? '/dashboard' : '/sign-in'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium text-base"
              >
                {isSignedIn ? 'Go to Dashboard' : 'Start Free Today'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-smooth font-medium text-base"
              >
                Learn More
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-accent">✓</span>
                </div>
                <span className="text-sm text-foreground/80">
                  Zero waste tracking
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-accent">✓</span>
                </div>
                <span className="text-sm text-foreground/80">
                  Family & community
                </span>
              </div>
            </div>
          </div>

          <div className="relative w-full h-96 md:h-full min-h-96 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl overflow-hidden flex items-center justify-center border border-border">
            <img
              src="/sustainability-hero.jpg"
              alt="Sustainable food management with recycling symbols and eco-friendly home"
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
