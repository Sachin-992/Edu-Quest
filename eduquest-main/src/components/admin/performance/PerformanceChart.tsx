import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface DistributionBucket {
    range: string;
    count: number;
    color: string;
}

interface PerformanceChartProps {
    data: DistributionBucket[];
}

const PerformanceChart = ({ data }: PerformanceChartProps) => {
    if (data.every((d) => d.count === 0)) {
        return (
            <div className="bg-card rounded-2xl shadow-card p-5">
                <h3 className="font-bold mb-4 flex items-center gap-2">📈 Class Score Distribution</h3>
                <p className="text-center text-muted-foreground py-8">No quiz data yet</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl shadow-card p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">📈 Class Score Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} barSize={48}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" tick={{ fontSize: 13 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                    <Tooltip
                        formatter={(value: number) => [`${value} students`, "Count"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))" }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {data.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PerformanceChart;
