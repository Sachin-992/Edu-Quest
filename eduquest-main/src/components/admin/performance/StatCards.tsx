import {
    TrendingUp, Trophy, AlertTriangle, Users,
} from "lucide-react";

interface StatCardsProps {
    classAvg: number;
    topPerformerName: string | null;
    topPerformerScore: number;
    strugglingCount: number;
    completionRate: number;
}

const StatCards = ({
    classAvg,
    topPerformerName,
    topPerformerScore,
    strugglingCount,
    completionRate,
}: StatCardsProps) => {
    const kpis = [
        {
            label: "Class Average",
            value: `${classAvg}%`,
            icon: TrendingUp,
            color: "bg-primary/10 text-primary",
        },
        {
            label: "Top Performer",
            value: topPerformerName
                ? `${topPerformerName.split(" ")[0]} ⭐ ${topPerformerScore}%`
                : "–",
            icon: Trophy,
            color:
                "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        },
        {
            label: "Struggling",
            value: `${strugglingCount} ⚠`,
            icon: AlertTriangle,
            color:
                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        },
        {
            label: "Completion Rate",
            value: `${completionRate}%`,
            icon: Users,
            color:
                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
                <div key={kpi.label} className="bg-card rounded-2xl p-5 shadow-card">
                    <div
                        className={`w-10 h-10 ${kpi.color} rounded-xl flex items-center justify-center mb-3`}
                    >
                        <kpi.icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-black truncate">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                        {kpi.label}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default StatCards;
