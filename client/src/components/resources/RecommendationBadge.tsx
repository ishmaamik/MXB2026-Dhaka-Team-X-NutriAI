import { DollarSign, Leaf, Heart, Utensils, Sparkles } from 'lucide-react';

interface RecommendationBadgeProps {
    reason: string;
}


export function RecommendationBadge({ reason }: RecommendationBadgeProps) {
    const getBadgeConfig = (reason: string) => {
        if (!reason) return null;
        const reasonLower = reason.toLowerCase();


        if (reasonLower.includes('budget')) {
            return {
                icon: DollarSign,
                color: 'bg-blue-100 text-blue-700 border-blue-200',
                label: 'Budget-Friendly',
            };
        }

        if (reasonLower.includes('waste')) {
            return {
                icon: Leaf,
                color: 'bg-green-100 text-green-700 border-green-200',
                label: 'Waste Reduction',
            };
        }

        if (reasonLower.includes('nutrition')) {
            return {
                icon: Heart,
                color: 'bg-pink-100 text-pink-700 border-pink-200',
                label: 'Nutrition',
            };
        }

        if (reasonLower.includes('meal')) {
            return {
                icon: Utensils,
                color: 'bg-purple-100 text-purple-700 border-purple-200',
                label: 'Meal Planning',
            };
        }

        // Default
        return {
            icon: Sparkles,
            color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            label: reason,
        };
    };

    const config = getBadgeConfig(reason);

    if (!config) return null;

    const Icon = config.icon;

    return (
        <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}
            title={`Recommended for: ${config.label}`}
        >
            <Icon className="h-3 w-3" />
            <span>{config.label}</span>
        </div>
    );
}
