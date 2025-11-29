import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'strong';
    hover?: boolean;
    glow?: 'cyan' | 'emerald' | 'none';
}

export default function GlassCard({
    children,
    className = '',
    variant = 'default',
    hover = true,
    glow = 'none',
}: GlassCardProps) {
    const baseClasses = variant === 'strong' ? 'glass-card-strong' : 'glass-card';
    const hoverClasses = hover ? 'hover-lift' : '';
    const glowClasses = glow === 'cyan' ? 'hover-glow' : glow === 'emerald' ? 'hover-glow' : '';

    return (
        <div
            className={`
        ${baseClasses}
        ${hoverClasses}
        ${glowClasses}
        rounded-xl
        transition-all
        duration-300
        ${className}
      `}
        >
            {children}
        </div>
    );
}
