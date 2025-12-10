import { useState } from 'react';

interface FAQItem {
    question: string;
    answer: string;
}

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs: FAQItem[] = [
        {
            question: 'What is PromptLens?',
            answer: 'PromptLens is an AI-powered tool that helps you optimize your prompts for better results from AI models like ChatGPT, Claude, and others. It analyzes your input and creates structured, effective prompts that get you more accurate and useful responses.',
        },
        {
            question: 'How does prompt optimization work?',
            answer: 'Our AI engine analyzes your prompt for clarity, context, and structure. It then enhances it by adding relevant context, clear instructions, output formatting guidelines, and best practices that help AI models understand exactly what you need.',
        },
        {
            question: 'Is there a free plan?',
            answer: 'Yes! Our free plan includes 10 prompt optimizations per day, which is perfect for trying out the service and handling basic prompt needs. For unlimited access and advanced features, check out our Pro plan.',
        },
        {
            question: 'Can I save my optimized prompts?',
            answer: 'Absolutely! All your optimized prompts are automatically saved to your personal library. You can organize them with tags, mark favorites, and easily reuse them whenever needed.',
        },
        {
            question: 'What AI models does this work with?',
            answer: 'PromptLens-optimized prompts work with all major AI models including OpenAI GPT models, Anthropic Claude, Google Gemini, Meta LLaMA, and more. Our optimization techniques are model-agnostic and improve results across platforms.',
        },
        {
            question: 'Is my data secure?',
            answer: 'Yes, we take security seriously. Your prompts are encrypted in transit and at rest. We never share your data with third parties or use your prompts to train our models. You can also delete your data at any time.',
        },
    ];

    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-800/50 uiux:bg-white/[0.02]">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white uiux:text-white mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 uiux:text-gray-300">
                        Everything you need to know about PromptLens
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="rounded-xl bg-white dark:bg-gray-800 uiux:bg-white/5 uiux:backdrop-blur-lg border border-gray-200 dark:border-gray-700 uiux:border-white/10 overflow-hidden transition-all"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 uiux:hover:bg-white/5 transition-colors"
                            >
                                <span className="font-semibold text-gray-900 dark:text-white uiux:text-white pr-4">
                                    {faq.question}
                                </span>
                                <svg
                                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 uiux:text-gray-400 transition-transform flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <div
                                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'
                                    }`}
                            >
                                <div className="px-6 pb-4 text-gray-600 dark:text-gray-300 uiux:text-gray-300">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
