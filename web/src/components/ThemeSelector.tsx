import { useTheme } from '@/contexts/ThemeContext';

type Theme = 'light' | 'dark' | 'uiux';

export default function ThemeSelector() {
    const { theme, setTheme } = useTheme();

    const themes: { value: Theme; label: string; icon: string }[] = [
        { value: 'light', label: 'Light', icon: '☀️' },
        { value: 'dark', label: 'Dark', icon: '🌙' },
        { value: 'uiux', label: 'UI/UX', icon: '✨' },
    ];

    return (
        <div className="inline-flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800 uiux:bg-white/10 uiux:backdrop-blur-md">
            {themes.map((t) => (
                <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`
                        relative px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                        ${theme === t.value
                            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white uiux:bg-gradient-to-r uiux:from-cyan-500 uiux:to-blue-500 uiux:text-white'
                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white uiux:text-gray-300 uiux:hover:text-white'
                        }
                    `}
                >
                    <span className="mr-1.5">{t.icon}</span>
                    {t.label}
                </button>
            ))}
        </div>
    );
}
