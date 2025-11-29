import { ReactNode, ButtonHTMLAttributes } from 'react';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    glow?: boolean;
}

export default function AnimatedButton({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    glow = false,
    className = '',
    disabled,
    ...props
}: AnimatedButtonProps) {
    const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 overflow-hidden group';

    const variantClasses = {
        primary: `
      bg-gradient-to-r from-cyan-500 to-blue-600
      text-white
      hover:from-cyan-400 hover:to-blue-500
      active:scale-95
      ${glow ? 'animate-glow-pulse' : ''}
    `,
        secondary: `
      bg-gradient-to-r from-emerald-500 to-teal-600
      text-white
      hover:from-emerald-400 hover:to-teal-500
      active:scale-95
    `,
        ghost: `
      bg-transparent
      border-2 border-cyan-500/50
      text-cyan-400
      hover:bg-cyan-500/10
      hover:border-cyan-400
      active:scale-95
    `,
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {/* Ripple effect overlay */}
            <span className="absolute inset-0 bg-white/20 scale-0 group-active:scale-100 transition-transform duration-300 rounded-lg" />

            {/* Content */}
            <span className="relative flex items-center gap-2">
                {loading && (
                    <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                )}
                {children}
            </span>
        </button>
    );
}
