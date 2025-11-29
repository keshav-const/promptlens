import { useEffect, useState } from 'react';
import GlassCard from './GlassCard';

interface StatCardProps {
    title: string;
    value: number;
    suffix?: string;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'cyan' | 'emerald' | 'ocean';
}

export default function StatCard({
    title,
    value,
    suffix = '',
    icon,
    trend,
    color = 'cyan',
}: StatCardProps) {
    const [displayValue, setDisplayValue] = useState(0);

    // Animated counter
    useEffect(() => {
        const duration = 1000; // 1 second
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += increment;

            if (step >= steps) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    const colorClasses = {
        cyan: {
            bg: 'from-cyan-500/20 to-blue-500/20',
            text: 'text-cyan-400',
            glow: 'cyan' as const,
        },
        emerald: {
            bg: 'from-emerald-500/20 to-teal-500/20',
            text: 'text-emerald-400',
            glow: 'emerald' as const,
        },
        ocean: {
            bg: 'from-blue-500/20 to-indigo-500/20',
            text: 'text-blue-400',
            glow: 'cyan' as const,
        },
    };

    const selectedColor = colorClasses[color];

    return (
        <GlassCard
            variant="strong"
            hover={true}
            glow={selectedColor.glow}
            className="p-6 animate-fade-in-up"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400 mb-2">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-3xl font-bold ${selectedColor.text}`}>
                            {displayValue.toLocaleString()}
                            {suffix && <span className="text-xl ml-1">{suffix}</span>}
                        </h3>
                    </div>
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            <span
                                className={`text-sm font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'
                                    }`}
                            >
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-gray-500">vs last period</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div
                        className={`
              p-3 rounded-lg
              bg-gradient-to-br ${selectedColor.bg}
              ${selectedColor.text}
            `}
                    >
                        {icon}
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
