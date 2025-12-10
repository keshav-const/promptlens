export default function HowItWorks() {
    const steps = [
        {
            step: 1,
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
            title: 'Enter Your Prompt',
            description: 'Paste or type your basic prompt that you want to optimize for better AI responses.',
        },
        {
            step: 2,
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            ),
            title: 'AI Analysis',
            description: 'Our AI engine analyzes your prompt structure, context, and intent to find optimization opportunities.',
        },
        {
            step: 3,
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: 'Get Enhanced Output',
            description: 'Receive a structured, optimized prompt with clear instructions, context, and formatting.',
        },
        {
            step: 4,
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
            ),
            title: 'Save & Reuse',
            description: 'Save your optimized prompts to your library, organize with tags, and reuse anytime.',
        },
    ];

    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-800/50 uiux:bg-white/[0.02]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white uiux:text-white mb-4">
                        How It Works
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 uiux:text-gray-300 max-w-2xl mx-auto">
                        Transform your prompts in four simple steps
                    </p>
                </div>

                <div className="relative">
                    {/* Connection Line */}
                    <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 transform -translate-y-1/2 uiux:opacity-30" />

                    <div className="grid md:grid-cols-4 gap-8 relative">
                        {steps.map((step, index) => (
                            <div key={index} className="relative">
                                {/* Step Card */}
                                <div className="bg-white dark:bg-gray-800 uiux:bg-white/5 uiux:backdrop-blur-lg rounded-2xl p-6 shadow-lg uiux:shadow-none uiux:border uiux:border-white/10 text-center relative z-10 transition-transform hover:scale-105">
                                    {/* Step Number */}
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                        {step.step}
                                    </div>

                                    {/* Icon */}
                                    <div className="mt-4 mb-4 mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-cyan-500 dark:text-cyan-400 uiux:text-cyan-400">
                                        {step.icon}
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white uiux:text-white mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 uiux:text-gray-300">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
