import React, { useState, useMemo } from 'react';
import { Brain, Check, Copy, Info, AlertCircle, Coffee, Sun, Moon, Zap, DollarSign, Utensils, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import MarkdownRenderer from './MarkdownRenderer';

interface MealOption {
  name: string;
  items: string[];
  cost: number;
}

interface Meal {
  type: string;
  name: string;
  nutrition: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
  option1: MealOption;
  option2: MealOption;
}

interface MealPlan {
  isMealPlan: boolean;
  summary: string;
  meals: Meal[];
  totalEstimatedCost: number;
}

interface AIResponseDisplayProps {
  response: {
    success: boolean;
    response?: string;
    toolsUsed?: number;
    insights?: string;
    error?: string;
  };
  className?: string;
  showTools?: boolean;
}

const MealPlanRenderer: React.FC<{ data: MealPlan }> = ({ data }) => {
  const getMealIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast': return <Coffee className="w-5 h-5" />;
      case 'lunch': return <Sun className="w-5 h-5" />;
      case 'dinner': return <Moon className="w-5 h-5" />;
      default: return <Utensils className="w-5 h-5" />;
    }
  };

  const getMealColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast': return 'from-orange-400 to-amber-500';
      case 'lunch': return 'from-blue-400 to-indigo-500';
      case 'dinner': return 'from-purple-500 to-fuchsia-600';
      default: return 'from-emerald-400 to-teal-500';
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Summary Header */}
      <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-purple-600" />
          <h4 className="font-bold text-purple-900">Personalized Strategy</h4>
        </div>
        <p className="text-purple-800/80 font-medium leading-relaxed italic">
          "{data.summary}"
        </p>
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {data.meals.map((meal, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex flex-col bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Meal Header */}
            <div className={`p-4 bg-gradient-to-br ${getMealColor(meal.type)} text-white`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{meal.type}</span>
                {getMealIcon(meal.type)}
              </div>
              <h3 className="font-bold text-lg leading-tight">{meal.name}</h3>
            </div>

            {/* Nutrition Row */}
            <div className="flex items-center justify-around p-3 bg-gray-50/80 border-b border-gray-100">
              <div className="text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Cals</div>
                <div className="text-sm font-black text-gray-700">{meal.nutrition.calories}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Prot</div>
                <div className="text-sm font-black text-gray-700">{meal.nutrition.protein}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Carb</div>
                <div className="text-sm font-black text-gray-700">{meal.nutrition.carbs}</div>
              </div>
            </div>

            {/* Options Space */}
            <div className="p-4 space-y-4 flex-1">
              {[meal.option1, meal.option2].map((opt, oIdx) => (
                <div key={oIdx} className="relative group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-purple-500 uppercase tracking-tighter">Option {oIdx + 1}</span>
                    <span className="text-xs font-black text-gray-900 group-hover:text-purple-600 transition-colors">৳{opt.cost}</span>
                  </div>
                  <div className="p-3 bg-white border border-gray-100 rounded-xl group-hover:border-purple-200 group-hover:bg-purple-50/30 transition-all">
                    <div className="font-bold text-sm text-gray-800 mb-2 truncate">{opt.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {opt.items.map((item, iIdx) => (
                        <span key={iIdx} className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-500 rounded-md uppercase tracking-tight">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Estimated Cost</div>
            <div className="text-xl font-black text-gray-900">৳{data.totalEstimatedCost}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
          <Activity className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-gray-600">Dynamic AI Recalculation Active</span>
        </div>
      </div>
    </div>
  );
};

const AIResponseDisplay: React.FC<AIResponseDisplayProps> = ({
  response,
  className = '',
  showTools = true,
}) => {
  const [copied, setCopied] = useState(false);

  const mealPlanData = useMemo(() => {
    if (!response.response) return null;
    try {
      // Clean possible markdown code blocks if the AI wrapped JSON in them
      const cleanJson = response.response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && parsed.isMealPlan) return parsed as MealPlan;
      return null;
    } catch (e) {
      return null;
    }
  }, [response.response]);

  const handleCopy = () => {
    if (response.response) {
      navigator.clipboard.writeText(response.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!response.success && response.error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-5 bg-red-50/50 border border-red-100 rounded-2xl backdrop-blur-sm ${className}`}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h4 className="font-bold text-red-900 mb-1">Analysis Error</h4>
            <p className="text-red-700 leading-relaxed">{response.error}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!response.response) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 bg-gray-50/50 border border-gray-200/50 rounded-2xl backdrop-blur-sm flex items-center justify-center ${className}`}
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Info className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No insights available for this section yet.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/60 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
    >
      {/* Decorative background element */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50" />

      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-200 border border-purple-400/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg leading-tight">AI Nutrition Assistant</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Analysis Complete</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showTools && response.toolsUsed && (
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-100 uppercase tracking-tight"
              >
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                {response.toolsUsed} Tools Used
              </motion.span>
            )}
            <button
              onClick={handleCopy}
              className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm group"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          {mealPlanData ? (
            <MealPlanRenderer data={mealPlanData} />
          ) : (
            <div className="text-gray-700 font-medium leading-relaxed">
              <MarkdownRenderer
                content={response.response}
                className="space-y-4"
              />
            </div>
          )}

          {response.insights && (
            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-sm font-semibold text-blue-600 italic">
                {response.insights}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AIResponseDisplay;
