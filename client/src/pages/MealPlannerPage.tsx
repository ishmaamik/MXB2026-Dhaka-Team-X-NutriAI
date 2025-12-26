import { useState } from 'react';
import {
  Calendar,
  Utensils,
  Sparkles,
  DollarSign,
  AlertCircle,
  Brain,
  ArrowRight,
  TrendingDown,
  ShoppingBag,
  ChefHat,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useApi } from '../hooks/useApi';
import { Link } from 'react-router-dom';

interface MealPlan {
  isMealPlan: boolean;
  summary: string;
  meals: Array<{
    type: string;
    name: string;
    nutrition: {
      calories: number;
      protein: string;
      carbs: string;
      fat: string;
    };
    option1?: {
      name: string;
      items: string[];
      cost: number;
    };
    option2: {
      name: string;
      items: string[];
      cost: number;
    };
  }>;
  totalEstimatedCost: number;
}

export default function MealPlannerPage() {
  const { profile } = useProfile();
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(() => {
    const saved = localStorage.getItem('current_meal_plan');
    return saved ? JSON.parse(saved) : null;
  });
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'current' | 'saved'>('current');
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [consuming, setConsuming] = useState<string | null>(null);
  
  const [config, setConfig] = useState({
    budget: 200,
    timePeriod: 'one_day',
  });

  const hasHealthMetrics = profile?.profile?.height && profile?.profile?.weight;

  const fetchSavedPlans = async () => {
    try {
      const response = await api.getSavedMealPlans();
      setSavedPlans(response.data);
    } catch (error) {
      console.error('Error fetching saved plans:', error);
    }
  };

  const generatePlan = async () => {
    setLoading(true);
    setShowConfig(false);
    setMealPlan(null);
    setRawResponse(null);
    try {
      console.log('Generating meal plan with config:', config);
      const response = await api.getOptimizedMealPlan({
        budget: config.budget,
        timePeriod: config.timePeriod,
      });
      
      console.log('API Response received:', response);

      if (!response.data || (!response.data.response && !response.data.mealPlan)) {
        throw new Error('AI service returned an empty or invalid response. Please try again.');
      }

      const content = response.data.response || JSON.stringify(response.data.mealPlan);
      
      console.log('Extracting JSON from content:', content.substring(0, 100) + '...');

      // Try to extract JSON from the AI response
      const jsonMatch = content.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
         try {
           let jsonString = jsonMatch[1];
           
           // Basic cleaning of common AI artifacts
           jsonString = jsonString.replace(/\\n/g, ' ')
                                .replace(/\r?\n|\r/g, ' ')
                                .trim();

           const parsed = JSON.parse(jsonString);
           
           console.log('Successfully parsed JSON:', parsed);

           // Validation and repair
           if (!parsed.isMealPlan && (parsed.meals || parsed.mealPlan)) {
             parsed.isMealPlan = true;
             // Handle case where AI wraps it in another object
             if (parsed.mealPlan && !parsed.meals) {
               Object.assign(parsed, parsed.mealPlan);
             }
           }

           if (parsed.isMealPlan && parsed.meals) {
             setMealPlan(parsed);
             localStorage.setItem('current_meal_plan', JSON.stringify(parsed));
           } else {
             console.warn('Parsed object is not a valid meal plan structure:', parsed);
             setRawResponse(content);
           }
         } catch (e) {
           console.error('JSON Parse Error Detail:', e, 'Raw content block:', content.substring(0, 200));
           setRawResponse(content);
         }
      } else {
        console.warn('No JSON structure found in AI response text');
        setRawResponse(content);
      }
    } catch (error: any) {
      console.error('Final generation error:', error);
      alert(error.message || 'Failed to generate meal plan. The AI might be busy, please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async (plan: MealPlan) => {
    try {
      await api.saveMealPlan(plan);
      alert('Meal plan saved successfully!');
      fetchSavedPlans();
    } catch (error) {
      console.error('Error saving meal plan:', error);
    }
  };

  const consumeMeal = async (idx: number, option: 'option1' | 'option2') => {
    if (!mealPlan) return;
    const meal = mealPlan.meals[idx];
    const items = option === 'option1' ? meal.option1?.items : meal.option2.items;
    
    if (!items) return;

    setConsuming(`${idx}-${option}`);
    try {
      await api.consumeMeal(meal.name, items);
      alert(`Consumed ${meal.name}! Inventory updated.`);
    } catch (error) {
      console.error('Error consuming meal:', error);
      alert('Failed to consume meal: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setConsuming(null);
    }
  };

  if (!hasHealthMetrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <Brain className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Complete Your Health Profile</h1>
        <p className="text-foreground/70">
          To generate a "Price-Smart Meal Plan" tailored to your metabolism and health goals, we need your height, weight, and preferences.
        </p>
        <Link
          to="/profile/edit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20"
        >
          Setup My Profile
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Price-Smart Meal Planner</h1>
            <div className="flex items-center gap-4">
              <p className="text-foreground/70 flex items-center gap-2 text-sm">
                <TrendingDown className="w-4 h-4 text-green-500" />
                Adapts to market prices and uses your inventory
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-secondary/20 p-1 rounded-xl border border-border flex">
            <button
              onClick={() => setViewMode('current')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'current' ? 'bg-background text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground'
              }`}
            >
              Current Plan
            </button>
            <button
              onClick={() => {
                setViewMode('saved');
                fetchSavedPlans();
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'saved' ? 'bg-background text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground'
              }`}
            >
              Saved Plans
            </button>
          </div>
          <button
            onClick={() => setShowConfig(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Generate New Plan
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="bg-card rounded-2xl border border-border p-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="font-bold text-xl mb-1">AI is analyzing market data...</p>
                <p className="text-foreground/60">Optimizing for budget and nutrition</p>
              </div>
            </div>
          ) : viewMode === 'saved' ? (
            <div className="space-y-6">
              {savedPlans.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {savedPlans.map((plan) => (
                    <div key={plan.id} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold">Meal Plan from {new Date(plan.createdAt).toLocaleDateString()}</h3>
                          <p className="text-sm text-foreground/60">{Array.isArray(plan.meals) ? plan.meals.length : 0} meals • ৳{plan.budget} budget</p>
                        </div>
                        <button 
                          onClick={() => {
                            setMealPlan({
                              isMealPlan: true,
                              summary: "Saved Plan",
                              meals: plan.meals,
                              totalEstimatedCost: plan.totalCost
                            });
                            setViewMode('current');
                          }}
                          className="px-4 py-2 bg-secondary text-foreground rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all"
                        >
                          Load Plan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-2xl border-2 border-dashed border-border p-12 text-center">
                   <Calendar className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                   <h3 className="text-lg font-bold">No saved plans yet</h3>
                   <p className="text-foreground/60">Generate and save a plan to see it here.</p>
                </div>
              )}
            </div>
          ) : mealPlan ? (
             <div className="space-y-6">
               <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex justify-between items-start">
                 <div className="flex-1">
                   <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                     <Info className="w-5 h-5 text-primary" />
                     Plan Summary
                   </h3>
                   <p className="text-foreground/80 leading-relaxed">{mealPlan.summary}</p>
                   <div className="mt-4 flex items-center gap-4">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">
                        Budget Used: ৳{mealPlan.totalEstimatedCost}
                      </span>
                   </div>
                 </div>
                 <button
                    onClick={() => savePlan(mealPlan)}
                    className="flex items-center gap-2 px-4 py-2 bg-background border border-primary/30 text-primary rounded-xl hover:bg-primary hover:text-white transition-all font-bold text-sm shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Save Plan
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {mealPlan.meals.map((meal, idx) => (
                   <div key={idx} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                     <div className="p-5 border-b border-border bg-secondary/5 flex justify-between items-start">
                       <div>
                         <span className="text-xs font-bold text-primary uppercase tracking-wider">{meal.type}</span>
                         <h4 className="text-lg font-bold text-foreground">{meal.name}</h4>
                       </div>
                       <ChefHat className="w-5 h-5 text-foreground/30" />
                     </div>
                     
                     <div className="p-5 space-y-4">
                       {/* Nutrition Pills */}
                       <div className="flex flex-wrap gap-2">
                         <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded">
                           🔥 {meal.nutrition.calories} kcal
                         </span>
                         <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">
                           🥩 {meal.nutrition.protein} Protein
                         </span>
                         <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-1 rounded">
                           🍞 {meal.nutrition.carbs} Carbs
                         </span>
                       </div>

                       {/* Options */}
                       <div className="space-y-3 pt-2">
                         {meal.option1 ? (
                           <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 relative overflow-hidden group/opt">
                             <div className="absolute top-0 right-0 bg-primary text-[8px] text-white px-2 py-0.5 rounded-bl-lg font-bold">
                               STOCK CONFIRMED
                             </div>
                             <div className="flex justify-between items-center mb-2">
                               <span className="text-xs font-bold text-primary flex items-center gap-1">
                                 <CheckCircle2 className="w-3 h-3" />
                                 Inventory Option
                               </span>
                               <span className="text-xs font-bold font-mono">৳{meal.option1.cost}</span>
                             </div>
                             <p className="text-sm font-bold mb-1">{meal.option1.name}</p>
                             <p className="text-[10px] text-foreground/60 leading-tight mb-3">
                               Uses: {meal.option1.items.join(', ')}
                             </p>
                             <button
                               onClick={() => consumeMeal(idx, 'option1')}
                               disabled={consuming === `${idx}-option1`}
                               className="w-full py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                             >
                               {consuming === `${idx}-option1` ? (
                                 <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                               ) : (
                                 <Utensils className="w-3 h-3" />
                               )}
                               Mark as Consumed
                             </button>
                           </div>
                         ) : (
                           <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                             <p className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                               <AlertCircle className="w-3 h-3" />
                               No inventory match found
                             </p>
                           </div>
                         )}

                         <div className="p-3 bg-secondary/10 rounded-xl border border-border group/opt">
                           <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-bold text-foreground/70 flex items-center gap-1">
                               <ShoppingBag className="w-3 h-3" />
                               Market Option
                             </span>
                             <span className="text-xs font-bold font-mono">৳{meal.option2.cost}</span>
                           </div>
                           <p className="text-sm font-bold mb-1">{meal.option2.name}</p>
                           <p className="text-[10px] text-foreground/60 leading-tight mb-3">
                             Buy: {meal.option2.items.join(', ')}
                           </p>
                           <button
                             onClick={() => consumeMeal(idx, 'option2')}
                             disabled={consuming === `${idx}-option2`}
                             className="w-full py-1.5 bg-secondary/20 text-foreground/70 text-[10px] font-bold rounded-lg hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                           >
                             {consuming === `${idx}-option2` ? (
                               <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                             ) : (
                               <Utensils className="w-3 h-3" />
                             )}
                             Mark as Consumed (Market Buy)
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          ) : rawResponse ? (
            <div className="bg-card rounded-2xl border border-border p-8 prose prose-slate dark:prose-invert max-w-none shadow-sm whitespace-pre-wrap">
              {rawResponse}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border-2 border-dashed border-border p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-secondary/20 rounded-full">
                <Utensils className="w-10 h-10 text-foreground/40" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">No Active Meal Plan</h2>
                <p className="text-foreground/60 max-w-md">
                  Select a budget and time period to receive a price-smart meal plan tailored for you.
                </p>
              </div>
              <button
                onClick={() => setShowConfig(true)}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Mini Dashboard */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Your Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-secondary/20 rounded-lg">
                <span className="text-sm font-medium opacity-70">Goal</span>
                <span className="text-sm font-bold capitalize">{profile?.profile?.weightPreference}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary/20 rounded-lg">
                <span className="text-sm font-medium opacity-70">BMI Context</span>
                <span className="text-sm font-bold">
                  {profile?.profile?.weight && profile?.profile?.height
                    ? (profile.profile.weight / Math.pow(profile.profile.height / 100, 2)).toFixed(1)
                    : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#16803C] to-[#9CB89F] rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold">Market Watch</h3>
            </div>
            <p className="text-sm text-white/90 mb-4 font-medium">
              We sync with local Dhaka market prices to suggest the most cost-effective proteins and vegetables.
            </p>
            <div className="bg-white/20 h-px w-full my-4" />
            <p className="text-xs text-white/70 italic text-center">
              Inventory data included in plan
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Plan Configuration</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Budget (BDT)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-foreground/40">৳</span>
                  <input
                    type="number"
                    value={config.budget}
                    onChange={(e) => setConfig({ ...config, budget: parseInt(e.target.value) })}
                    className="w-full pl-8 pr-4 py-3 bg-secondary/20 border-border border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
                  />
                </div>
                <p className="text-xs text-foreground/50 mt-2">Budget for the entire period selected</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Time Period
                </label>
                <select
                  value={config.timePeriod}
                  onChange={(e) => setConfig({ ...config, timePeriod: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary/20 border-border border rounded-xl outline-none font-medium"
                >
                  <optgroup label="Single Meals">
                    <option value="breakfast">Breakfast Only</option>
                    <option value="lunch">Lunch Only</option>
                    <option value="dinner">Dinner Only</option>
                  </optgroup>
                  <optgroup label="Full Plans">
                    <option value="one_day">Full Day (5 Meals)</option>
                    <option value="one_week">Full Week (35 Meals)</option>
                  </optgroup>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowConfig(false)}
                  className="flex-1 py-3 px-4 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={generatePlan}
                  className="flex-1 py-3 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all text-sm"
                >
                  Generate Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
