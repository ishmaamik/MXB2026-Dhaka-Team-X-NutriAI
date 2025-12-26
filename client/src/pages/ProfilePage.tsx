import { Link } from 'react-router-dom';
import { User, Mail, Utensils, MapPin, DollarSign, Edit, ArrowLeft, Ruler, Scale, Target, AlertCircle } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

export default function ProfilePage() {
  const { profile, loading, error } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground/70">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Profile</h2>
          <p className="text-foreground/70 mb-6">{error}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-foreground/70 hover:text-primary transition-smooth"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Profile Header */}
      <div className="bg-card rounded-2xl border border-border p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {profile?.profile?.fullName || 'User'}
              </h1>
              <p className="text-foreground/70">{profile?.email || 'No email'}</p>
            </div>
          </div>

          <Link
            to="/profile/edit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-card rounded-2xl border border-border p-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">Profile Information</h2>

        <div className="space-y-6">
          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground/70 mb-1">Email Address</p>
              <p className="text-foreground">{profile?.email || 'Not provided'}</p>
            </div>
          </div>

          {/* Full Name */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground/70 mb-1">Full Name</p>
              <p className="text-foreground">{profile?.profile?.fullName || 'Not provided'}</p>
            </div>
          </div>

          {/* Dietary Preference */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Utensils className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground/70 mb-1">Dietary Preference</p>
              <p className="text-foreground capitalize">
                {profile?.profile?.dietaryPreference || 'Not specified'}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground/70 mb-1">Location</p>
              <p className="text-foreground">{profile?.profile?.location || 'Not provided'}</p>
            </div>
          </div>

          {/* Budget Range */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground/70 mb-1">Monthly Budget</p>
              <p className="text-foreground">
                {profile?.profile?.budgetRange ? `$${profile.profile.budgetRange.toFixed(2)}` : 'Not set'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
            {/* Height */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Ruler className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground/70 mb-1">Height</p>
                <p className="text-foreground">{profile?.profile?.height ? `${profile.profile.height} cm` : 'Not set'}</p>
              </div>
            </div>

            {/* Weight */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground/70 mb-1">Weight</p>
                <p className="text-foreground">{profile?.profile?.weight ? `${profile.profile.weight} kg` : 'Not set'}</p>
              </div>
            </div>

            {/* Weight Goal */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground/70 mb-1">Weight Goal</p>
                <p className="text-foreground capitalize">{profile?.profile?.weightPreference || 'Not set'}</p>
              </div>
            </div>

            {/* Allergies */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground/70 mb-1">Allergies</p>
                <p className="text-foreground">{profile?.profile?.allergies || 'None reported'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-card rounded-2xl border border-border p-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">Account Information</h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-foreground/70">Member since</span>
            <span className="text-foreground font-medium">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-foreground/70">Last updated</span>
            <span className="text-foreground font-medium">
              {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}