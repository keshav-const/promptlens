import { ReactNode, CSSProperties } from 'react';

interface FloatingElementProps {
    children: ReactNode;
    className?: string;
    speed?: 'slow' | 'normal' | 'fast';
    depth?: 'sm' | 'md' | 'lg';
    style?: CSSProperties;
}

export default function FloatingElement({
    children,
    className = '',
    speed = 'normal',
    depth = 'md',
    style,
}: FloatingElementProps) {
    const speedClasses = {
        slow: 'animate-float-slow',
        normal: 'animate-float',
        fast: 'animate-float',
    };

    const depthShadows = {
        sm: 'drop-shadow-lg',
        md: 'drop-shadow-xl',
        lg: 'drop-shadow-2xl',
    };

    const animationDuration = speed === 'fast' ? '4s' : speed === 'slow' ? '8s' : '6s';

    return (
        <div
            className={`
        transform-3d
        ${speedClasses[speed]}
        ${depthShadows[depth]}
        ${className}
      `}
            style={{
                animationDuration,
                ...style,
            }}
        >
            {children}
        </div>
    );
}
