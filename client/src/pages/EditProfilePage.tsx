import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Utensils, MapPin, DollarSign, Save, ArrowLeft, Ruler, Scale, Target, AlertCircle } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useApi } from '../hooks/useApi';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useProfile();
  const api = useApi();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    dietaryPreference: '',
    location: '',
    budgetRange: '',
    height: '',
    weight: '',
    weightPreference: '',
    allergies: '',
  });

  useEffect(() => {
    if (profile?.profile) {
      setFormData({
        fullName: profile.profile.fullName || '',
        dietaryPreference: profile.profile.dietaryPreference || '',
        location: profile.profile.location || '',
        budgetRange: profile.profile.budgetRange?.toString() || '',
        height: profile.profile.height?.toString() || '',
        weight: profile.profile.weight?.toString() || '',
        weightPreference: profile.profile.weightPreference || '',
        allergies: profile.profile.allergies || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.updateProfile({
        fullName: formData.fullName,
        dietaryPreference: formData.dietaryPreference || undefined,
        location: formData.location || undefined,
        budgetRange: formData.budgetRange ? parseFloat(formData.budgetRange) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        weightPreference: formData.weightPreference || undefined,
        allergies: formData.allergies || undefined,
      });

      await refreshProfile();
      setSuccess(true);

      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      console.error('Error updating profile:', err);
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/profile"
        className="inline-flex items-center gap-2 text-foreground/70 hover:text-primary transition-smooth"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Profile
      </Link>

      {/* Form */}
      <div className="bg-card rounded-2xl border border-border p-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <User className="w-4 h-4 text-primary" />
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

          {/* Dietary Preference */}
          <div>
            <label htmlFor="dietaryPreference" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Utensils className="w-4 h-4 text-primary" />
              Dietary Preference
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

          {/* Location */}
          <div>
            <label htmlFor="location" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              Location
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

          {/* Budget Range */}
          <div>
            <label htmlFor="budgetRange" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Monthly Budget
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Height */}
            <div>
              <label htmlFor="height" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Ruler className="w-4 h-4 text-primary" />
                Height (cm)
              </label>
              <input
                type="number"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                placeholder="e.g., 170"
              />
            </div>

            {/* Weight */}
            <div>
              <label htmlFor="weight" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Scale className="w-4 h-4 text-primary" />
                Weight (kg)
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                placeholder="e.g., 70"
              />
            </div>
          </div>

          {/* Weight Preference */}
          <div>
            <label htmlFor="weightPreference" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Target className="w-4 h-4 text-primary" />
              Weight Goal
            </label>
            <select
              id="weightPreference"
              name="weightPreference"
              value={formData.weightPreference}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            >
              <option value="">Select a goal</option>
              <option value="lose">Lose Weight</option>
              <option value="maintain">Maintain Weight</option>
              <option value="gain">Gain Weight</option>
            </select>
          </div>

          {/* Allergies */}
          <div>
            <label htmlFor="allergies" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              Allergies
            </label>
            <input
              type="text"
              id="allergies"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              placeholder="e.g., Peanuts, Seafood, Dairy"
            />
            <p className="mt-1 text-xs text-foreground/50">Separate allergies with commas</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">Profile updated successfully! Redirecting...</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-smooth font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}