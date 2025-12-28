import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Leaf, User, Utensils, MapPin, DollarSign, ArrowRight } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useProfile } from '../context/ProfileContext';

export default function OnboardingPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const api = useApi();
  const { refreshProfile } = useProfile();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    dietaryPreference: '',
    location: '',
    budgetRange: '',
  });

  useEffect(() => {
    // Pre-fill name from Clerk if available
    if (user?.firstName || user?.lastName) {
      setFormData((prev) => ({
        ...prev,
        fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = () => {
    if (step === 1 && !formData.fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.updateProfile({
        fullName: formData.fullName,
        dietaryPreference: formData.dietaryPreference || undefined,
        location: formData.location || undefined,
        budgetRange: formData.budgetRange ? parseFloat(formData.budgetRange) : undefined,
      });

      await refreshProfile();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
      console.error('Error saving profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const dietaryOptions = [
    { value: '', label: 'Select preference' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'pescatarian', label: 'Pescatarian' },
    { value: 'omnivore', label: 'Omnivore' },
    { value: 'keto', label: 'Keto' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'gluten-free', label: 'Gluten-Free' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#2D5A27] to-[#8FBC8F] rounded-2xl mb-4 shadow-lg">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to NutriTrack! 🌱</h1>
          <p className="text-foreground/70">Let's set up your profile to get started</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Step {step} of 4</span>
            <span className="text-sm text-foreground/70">{Math.round((step / 4) * 100)}% complete</span>
          </div>
          <div className="w-full bg-[#E8DFD5] rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#A67B5B] to-[#8B5A3C] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <div className="bg-card rounded-2xl border border-[#E8DFD5] p-8 shadow-xl">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Full Name */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#A67B5B]/10 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-[#A67B5B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">What's your name?</h2>
                    <p className="text-sm text-foreground/70">Let us know how to address you</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
                    Full Name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Dietary Preference */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#2D5A27]/10 rounded-xl flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-[#2D5A27]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Dietary Preference</h2>
                    <p className="text-sm text-foreground/70">Help us personalize your experience</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="dietaryPreference" className="block text-sm font-medium text-foreground mb-2">
                    What's your dietary preference?
                  </label>
                  <select
                    id="dietaryPreference"
                    name="dietaryPreference"
                    value={formData.dietaryPreference}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  >
                    {dietaryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#A67B5B]/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#A67B5B]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Where are you located?</h2>
                    <p className="text-sm text-foreground/70">For local community features</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                    Location (City, Country)
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder="e.g., Dhaka, Bangladesh"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Budget Range */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#2D5A27]/10 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#2D5A27]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Monthly Food Budget</h2>
                    <p className="text-sm text-foreground/70">Optional - helps track spending</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="budgetRange" className="block text-sm font-medium text-foreground mb-2">
                    Budget Range (in your currency)
                  </label>
                  <input
                    type="number"
                    id="budgetRange"
                    name="budgetRange"
                    value={formData.budgetRange}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-smooth font-medium"
                  disabled={loading}
                >
                  Back
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium inline-flex items-center justify-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Skip Option */}
          {step < 4 && (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-sm text-foreground/60 hover:text-primary transition-smooth"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}