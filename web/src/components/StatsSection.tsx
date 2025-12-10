import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
    end: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
}

function AnimatedNumber({ end, duration = 2000, suffix = '', prefix = '' }: AnimatedCounterProps) {
    const [count, setCount] = useState(0);
    const countRef = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated.current) {
                        hasAnimated.current = true;

                        const startTime = performance.now();
                        const animate = (currentTime: number) => {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);

                            // Ease out cubic
                            const easeOut = 1 - Math.pow(1 - progress, 3);
                            setCount(Math.floor(end * easeOut));

                            if (progress < 1) {
                                requestAnimationFrame(animate);
                            }
                        };
                        requestAnimationFrame(animate);
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (countRef.current) {
            observer.observe(countRef.current);
        }

        return () => observer.disconnect();
    }, [end, duration]);

    return (
        <span ref={countRef} className="tabular-nums">
            {prefix}{count.toLocaleString()}{suffix}
        </span>
    );
}

export default function StatsSection() {
    const stats = [
        { value: 50000, suffix: '+', label: 'Prompts Optimized', icon: '⚡' },
        { value: 35, suffix: '%', label: 'Average Token Savings', icon: '📉' },
        { value: 2500, suffix: '+', label: 'Happy Users', icon: '👥' },
        { value: 99, suffix: '%', label: 'Satisfaction Rate', icon: '⭐' },
    ];

    return (
        <section className="py-20 relative">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white uiux:text-white mb-4">
                        Trusted by Prompt Engineers Worldwide
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 uiux:text-gray-300 max-w-2xl mx-auto">
                        Join thousands of users who are already getting better results with optimized prompts
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="text-center p-6 rounded-2xl bg-white dark:bg-gray-800 uiux:bg-white/5 uiux:backdrop-blur-lg uiux:border uiux:border-white/10 shadow-lg uiux:shadow-none transition-transform hover:scale-105"
                        >
                            <div className="text-4xl mb-3">{stat.icon}</div>
                            <div className="text-4xl md:text-5xl font-bold text-primary-600 dark:text-primary-400 uiux:text-cyan-400 mb-2">
                                <AnimatedNumber end={stat.value} suffix={stat.suffix} />
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 uiux:text-gray-300 font-medium">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
