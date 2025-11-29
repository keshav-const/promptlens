import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';

export default function ThemeDebug() {
    const { theme } = useTheme();
    const [htmlClass, setHtmlClass] = useState('');

    useEffect(() => {
        setHtmlClass(document.documentElement.className);
    }, [theme]);

    if (process.env.NODE_ENV === 'production') return null;

    return (
        <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-[9999] max-w-xs">
            <div className="font-bold mb-2">Theme Debug</div>
            <div>Context Theme: <span className="text-cyan-400">{theme}</span></div>
            <div>HTML Classes: <span className="text-emerald-400">{htmlClass || 'none'}</span></div>
            <div className="mt-2 p-2 bg-white/10 rounded">
                <div className="uiux:text-cyan-400 dark:text-yellow-400">
                    Test: {theme === 'uiux' ? '✅ UIUX' : theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </div>
            </div>
        </div>
    );
}
