import { useState } from 'react';

export default function InteractiveDemo() {
    const [inputPrompt, setInputPrompt] = useState('');
    const [optimizedPrompt, setOptimizedPrompt] = useState('');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [hasOptimized, setHasOptimized] = useState(false);

    const samplePrompts = [
        "Write a blog post about AI",
        "Help me with my code",
        "Create a marketing email",
    ];

    // Mock optimization function
    const optimizePrompt = async (prompt: string) => {
        setIsOptimizing(true);
        setHasOptimized(false);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock optimized result
        const optimizations: Record<string, string> = {
            "Write a blog post about AI": `You are an expert technology writer specializing in artificial intelligence. Write a comprehensive, engaging blog post about AI that:

1. Opens with a compelling hook that captures reader attention
2. Explains key AI concepts in accessible language
3. Includes real-world applications and examples
4. Addresses common misconceptions
5. Concludes with future implications

Target audience: Tech-curious professionals
Tone: Informative yet conversational
Length: 1200-1500 words
Include: Subheadings, bullet points for scannability`,

            "Help me with my code": `You are a senior software engineer with expertise in debugging and code optimization. I need assistance with my code.

Context: [Describe your programming language and framework]
Problem: [Explain the specific issue you're facing]
Expected behavior: [What should happen]
Actual behavior: [What is happening instead]

Please:
1. Identify the root cause of the issue
2. Provide a corrected code solution
3. Explain why the fix works
4. Suggest any best practices or optimizations`,

            "Create a marketing email": `You are a conversion-focused email marketing specialist. Create a compelling marketing email with these specifications:

Product/Service: [Your offering]
Target audience: [Demographics and pain points]
Goal: [Primary CTA - e.g., sign up, purchase, download]

Structure:
- Subject line: Attention-grabbing, under 50 characters
- Preview text: Compelling snippet that drives opens
- Opening: Personalized hook addressing pain point
- Body: Benefits-focused, scannable content
- CTA: Clear, action-oriented button text
- P.S.: Urgency or bonus incentive

Tone: Professional yet friendly
Length: 150-200 words`,
        };

        const result = optimizations[prompt] || `You are an expert assistant. ${prompt}

Please provide:
1. Clear, structured response
2. Specific examples where relevant
3. Actionable recommendations
4. Format for easy reading

Context: [Add relevant background]
Constraints: [Specify any limitations]
Output format: [Desired structure]`;

        setOptimizedPrompt(result);
        setIsOptimizing(false);
        setHasOptimized(true);
    };

    const getTokenCount = (text: string) => Math.ceil(text.length / 4);

    return (
        <section className="py-20 relative">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white uiux:text-white mb-4">
                        Try It Now
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 uiux:text-gray-300 max-w-2xl mx-auto">
                        See how PromptLens transforms your basic prompts into powerful, structured instructions
                    </p>
                </div>

                {/* Sample prompt buttons */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                    {samplePrompts.map((prompt, index) => (
                        <button
                            key={index}
                            onClick={() => setInputPrompt(prompt)}
                            className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 uiux:bg-white/10 text-gray-700 dark:text-gray-300 uiux:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 uiux:hover:bg-white/20 transition-colors"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Input Panel */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white uiux:text-white">
                                Your Prompt
                            </h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400 uiux:text-gray-400">
                                ~{getTokenCount(inputPrompt)} tokens
                            </span>
                        </div>
                        <textarea
                            value={inputPrompt}
                            onChange={(e) => setInputPrompt(e.target.value)}
                            placeholder="Enter your prompt here or click a sample above..."
                            className="w-full h-64 p-4 rounded-xl border border-gray-200 dark:border-gray-700 uiux:border-white/20 bg-white dark:bg-gray-800 uiux:bg-white/5 text-gray-900 dark:text-white uiux:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 uiux:focus:ring-cyan-500 focus:border-transparent resize-none"
                        />
                        <button
                            onClick={() => optimizePrompt(inputPrompt)}
                            disabled={!inputPrompt.trim() || isOptimizing}
                            className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isOptimizing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Optimizing...
                                </>
                            ) : (
                                <>
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Optimize Prompt
                                </>
                            )}
                        </button>
                    </div>

                    {/* Output Panel */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white uiux:text-white">
                                Optimized Result
                            </h3>
                            {hasOptimized && (
                                <span className="text-sm text-emerald-500 font-medium">
                                    ~{getTokenCount(optimizedPrompt)} tokens
                                </span>
                            )}
                        </div>
                        <div className="w-full h-64 p-4 rounded-xl border border-gray-200 dark:border-gray-700 uiux:border-cyan-500/30 bg-gray-50 dark:bg-gray-900 uiux:bg-cyan-500/5 overflow-y-auto">
                            {hasOptimized ? (
                                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 uiux:text-gray-200 font-mono">
                                    {optimizedPrompt}
                                </pre>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    <p className="text-center">
                                        Your optimized prompt will appear here
                                        <br />
                                        <span className="text-sm">Enter a prompt and click Optimize</span>
                                    </p>
                                </div>
                            )}
                        </div>
                        {hasOptimized && (
                            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 uiux:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 uiux:border-emerald-500/30">
                                <span className="text-sm text-emerald-700 dark:text-emerald-300 uiux:text-emerald-400">
                                    ✨ Prompt enhanced with structure and context
                                </span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(optimizedPrompt)}
                                    className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                    Copy
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
