import {
  Calendar,
  ChefHat,
  Plus,
  Clock,
  Utensils,
  Sparkles,
} from 'lucide-react';

export default function MealPlannerPage() {
  const categories = [
    { name: 'Breakfast', icon: <Utensils className="w-5 h-5" />, color: 'bg-orange-100 text-orange-600' },
    { name: 'Lunch', icon: <ChefHat className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
    { name: 'Dinner', icon: <Sparkles className="w-5 h-5" />, color: 'bg-purple-100 text-purple-600' },
    { name: 'Snacks', icon: <AppleIcon />, color: 'bg-green-100 text-green-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Meal Planner</h1>
          <p className="text-foreground/70">
            Plan your meals and maintain a healthy lifestyle
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm font-medium">
          <Plus className="w-4 h-4" />
          Add Meal Plan
        </button>
      </div>

      {/* Weekly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Calendar Strip */}
          <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between overflow-x-auto gap-4">
            {[...Array(7)].map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const isToday = i === 0;
              return (
                <button
                  key={i}
                  className={`flex flex-col items-center min-w-[70px] py-3 rounded-xl transition-all ${
                    isToday
                      ? 'bg-primary text-primary-foreground shadow-md scale-105'
                      : 'hover:bg-secondary/20 text-foreground/70 hover:text-foreground'
                  }`}
                >
                  <span className="text-xs font-medium uppercase mb-1">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-xl font-bold">
                    {date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Daily Schedule */}
          <div className="space-y-4">
            {categories.map((category) => (
              <div
                key={category.name}
                className="group bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between font-medium">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${category.color}`}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-foreground/60">
                        <Clock className="w-3 h-3" />
                        <span>Not scheduled yet</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar/Stats card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white shadow-xl overflow-hidden relative">
            <Sparkles className="absolute -right-4 -top-4 w-24 h-24 opacity-20 rotate-12" />
            <h3 className="text-xl font-bold mb-4 relative z-10">AI Suggestions</h3>
            <p className="text-sm text-white/80 mb-6 relative z-10">
              Based on your inventory, we recommend a Mediterranean diet for this week.
            </p>
            <button className="w-full py-2 bg-white text-primary rounded-lg font-bold text-sm hover:bg-opacity-90 transition-all relative z-10">
              Generate Plan
            </button>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              This Week's Goal
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-foreground/70">Calories</span>
                  <span className="font-semibold text-foreground">1,250 / 2,000</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[62.5%] transition-all" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-foreground/70">Protein</span>
                  <span className="font-semibold text-foreground">45g / 75g</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[60%] transition-all" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
      <path d="M10 2c1 .5 2 2 2 5" />
    </svg>
  );
}
