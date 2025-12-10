import { useTheme } from '@/contexts/ThemeContext';
import { useState, useRef, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'uiux';

export default function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const themes: { value: Theme; label: string; icon: string }[] = [
        { value: 'light', label: 'Light', icon: '☀️' },
        { value: 'dark', label: 'Dark', icon: '🌙' },
        { value: 'uiux', label: 'UI/UX', icon: '✨' },
    ];

    const currentTheme = themes.find(t => t.value === theme) || themes[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-md p-2 text-gray-700 dark:text-gray-300 uiux:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 uiux:hover:bg-white/10 transition-colors"
                title="Change theme"
            >
                <span className="text-lg">{currentTheme.icon}</span>
                <svg
                    className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-lg bg-white dark:bg-gray-800 uiux:bg-gray-900/95 uiux:backdrop-blur-xl shadow-xl border border-gray-200 dark:border-gray-700 uiux:border-cyan-500/30 py-1 z-[9999]">
                    {themes.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => handleThemeChange(t.value)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                                ${theme === t.value
                                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 uiux:bg-cyan-500/20 uiux:text-cyan-400'
                                    : 'text-gray-700 dark:text-gray-200 uiux:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 uiux:hover:bg-cyan-500/10'
                                }
                            `}
                        >
                            <span className="text-lg">{t.icon}</span>
                            <span>{t.label}</span>
                            {theme === t.value && (
                                <svg className="ml-auto h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
