import { Link } from 'react-router-dom'
import { Leaf, Heart } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    Product: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#' },
      { label: 'Security', href: '#' },
    ],
    Company: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
    ],
    Legal: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  }

  return (
    <footer className="border-t border-border bg-[#FAFAF8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-[#2D5A27] to-[#8FBC8F] rounded-xl flex items-center justify-center shadow-sm">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-foreground">NutriTrack</span>
            </Link>
            <p className="text-foreground/60 text-sm leading-relaxed max-w-sm">
              Building a sustainable future through smart food management and community action. Supporting SDG 2 & 12.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-foreground/60 hover:text-[#A67B5B] transition-smooth text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-foreground/50 text-sm flex items-center gap-1">
            © {currentYear} NutriTrack. Made with <Heart className="w-3 h-3 text-[#A67B5B] fill-current" /> for the planet.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-foreground/50 hover:text-[#A67B5B] transition-smooth text-sm">
              Twitter
            </a>
            <a href="#" className="text-foreground/50 hover:text-[#A67B5B] transition-smooth text-sm">
              LinkedIn
            </a>
            <a href="#" className="text-foreground/50 hover:text-[#A67B5B] transition-smooth text-sm">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}