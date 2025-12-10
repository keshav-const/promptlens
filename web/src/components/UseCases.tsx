export default function UseCases() {
    const useCases = [
        {
            title: 'Developers',
            icon: '👨‍💻',
            color: 'from-blue-500 to-indigo-600',
            borderColor: 'uiux:border-blue-500/30',
            benefits: [
                'Generate better code explanations',
                'Create precise debugging prompts',
                'Write clear documentation requests',
                'Optimize API integration queries',
            ],
        },
        {
            title: 'Content Writers',
            icon: '✍️',
            color: 'from-purple-500 to-pink-600',
            borderColor: 'uiux:border-purple-500/30',
            benefits: [
                'Craft engaging blog post outlines',
                'Generate creative content ideas',
                'Improve SEO-focused writing prompts',
                'Create consistent brand voice',
            ],
        },
        {
            title: 'Researchers',
            icon: '🔬',
            color: 'from-emerald-500 to-teal-600',
            borderColor: 'uiux:border-emerald-500/30',
            benefits: [
                'Structure complex research queries',
                'Summarize academic papers efficiently',
                'Generate literature review prompts',
                'Analyze data with precision',
            ],
        },
        {
            title: 'Marketers',
            icon: '📈',
            color: 'from-orange-500 to-red-600',
            borderColor: 'uiux:border-orange-500/30',
            benefits: [
                'Create compelling ad copy',
                'Generate email campaigns',
                'Optimize social media content',
                'Craft persuasive landing pages',
            ],
        },
    ];

    return (
        <section className="py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white uiux:text-white mb-4">
                        Built for Every Creator
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 uiux:text-gray-300 max-w-2xl mx-auto">
                        Whether you're coding, writing, researching, or marketing — optimized prompts help you achieve more
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {useCases.map((useCase, index) => (
                        <div
                            key={index}
                            className={`rounded-2xl p-6 bg-white dark:bg-gray-800 uiux:bg-white/5 uiux:backdrop-blur-lg shadow-lg uiux:shadow-none border border-gray-100 dark:border-gray-700 ${useCase.borderColor} transition-all hover:scale-105 hover:shadow-xl uiux:hover:bg-white/10`}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${useCase.color} flex items-center justify-center text-2xl`}>
                                    {useCase.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white uiux:text-white">
                                    {useCase.title}
                                </h3>
                            </div>

                            {/* Benefits List */}
                            <ul className="space-y-3">
                                {useCase.benefits.map((benefit, benefitIndex) => (
                                    <li key={benefitIndex} className="flex items-start gap-2">
                                        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm text-gray-600 dark:text-gray-300 uiux:text-gray-300">
                                            {benefit}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
