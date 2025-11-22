import { Template, ITemplate } from '../models/index.js';
import mongoose from 'mongoose';

export interface CreateTemplateData {
    name: string;
    description: string;
    content: string;
    category: string;
    tags?: string[];
    isPublic?: boolean;
}

export interface TemplateFilters {
    category?: string;
    search?: string;
    tags?: string[];
    createdBy?: string;
    isPublic?: boolean;
}

export class TemplateService {
    async createTemplate(
        userId: string | mongoose.Types.ObjectId,
        data: CreateTemplateData
    ): Promise<ITemplate> {
        const template = await Template.create({
            ...data,
            createdBy: userId,
            usageCount: 0,
            rating: 0,
        });

        return template;
    }

    async getTemplates(filters: TemplateFilters = {}): Promise<ITemplate[]> {
        const query: any = {};

        // Public templates by default, or user's own templates
        if (filters.isPublic !== undefined) {
            query.isPublic = filters.isPublic;
        } else {
            query.$or = [{ isPublic: true }, { createdBy: filters.createdBy }];
        }

        if (filters.category) {
            query.category = filters.category;
        }

        if (filters.tags && filters.tags.length > 0) {
            query.tags = { $in: filters.tags };
        }

        if (filters.search) {
            query.$text = { $search: filters.search };
        }

        const templates = await Template.find(query)
            .sort({ usageCount: -1, createdAt: -1 })
            .limit(100)
            .populate('createdBy', 'displayName email');

        return templates;
    }

    async getTemplateById(templateId: string | mongoose.Types.ObjectId): Promise<ITemplate | null> {
        return Template.findById(templateId).populate('createdBy', 'displayName email');
    }

    async updateTemplate(
        templateId: string | mongoose.Types.ObjectId,
        userId: string | mongoose.Types.ObjectId,
        data: Partial<CreateTemplateData>
    ): Promise<ITemplate | null> {
        // Only allow updating own templates
        const template = await Template.findOneAndUpdate(
            { _id: templateId, createdBy: userId },
            { $set: data },
            { new: true, runValidators: true }
        );

        return template;
    }

    async deleteTemplate(
        templateId: string | mongoose.Types.ObjectId,
        userId: string | mongoose.Types.ObjectId
    ): Promise<boolean> {
        const result = await Template.deleteOne({ _id: templateId, createdBy: userId });
        return result.deletedCount > 0;
    }

    async incrementUsage(templateId: string | mongoose.Types.ObjectId): Promise<ITemplate | null> {
        return Template.findByIdAndUpdate(
            templateId,
            { $inc: { usageCount: 1 } },
            { new: true }
        );
    }

    async getCategories(): Promise<string[]> {
        return ['coding', 'writing', 'marketing', 'business', 'education', 'creative', 'other'];
    }

    async seedInitialTemplates(adminUserId: string | mongoose.Types.ObjectId): Promise<void> {
        const existingCount = await Template.countDocuments();

        if (existingCount > 0) {
            console.log('Templates already exist, skipping seed');
            return;
        }

        const initialTemplates = [
            {
                name: 'Code Review',
                description: 'Get detailed code review with suggestions for improvement',
                content: 'Review the following code and provide:\n1. Potential bugs or issues\n2. Performance improvements\n3. Best practices recommendations\n4. Security concerns\n\nCode:\n{{code}}',
                category: 'coding',
                tags: ['code-review', 'debugging', 'best-practices'],
                isPublic: true,
                createdBy: adminUserId,
            },
            {
                name: 'Blog Post Outline',
                description: 'Generate a comprehensive blog post outline',
                content: 'Create a detailed blog post outline for the topic: {{topic}}\n\nInclude:\n- Catchy title\n- Introduction hook\n- 5-7 main sections with subpoints\n- Conclusion\n- Call to action',
                category: 'writing',
                tags: ['blog', 'content', 'outline'],
                isPublic: true,
                createdBy: adminUserId,
            },
            {
                name: 'Email Marketing Campaign',
                description: 'Create engaging email marketing content',
                content: 'Write a marketing email for {{product/service}} targeting {{audience}}.\n\nInclude:\n- Subject line (A/B test options)\n- Personalized greeting\n- Value proposition\n- Social proof\n- Clear CTA\n- P.S. line',
                category: 'marketing',
                tags: ['email', 'marketing', 'copywriting'],
                isPublic: true,
                createdBy: adminUserId,
            },
            {
                name: 'Meeting Summary',
                description: 'Summarize meeting notes into action items',
                content: 'Summarize the following meeting notes:\n\n{{notes}}\n\nProvide:\n1. Key decisions made\n2. Action items with owners\n3. Next steps\n4. Follow-up required',
                category: 'business',
                tags: ['meeting', 'summary', 'productivity'],
                isPublic: true,
                createdBy: adminUserId,
            },
            {
                name: 'Explain Like I\'m 5',
                description: 'Simplify complex topics for easy understanding',
                content: 'Explain {{topic}} in simple terms that a 5-year-old would understand.\n\nUse:\n- Simple analogies\n- Everyday examples\n- Short sentences\n- No jargon',
                category: 'education',
                tags: ['education', 'simplify', 'teaching'],
                isPublic: true,
                createdBy: adminUserId,
            },
            {
                name: 'Creative Story Starter',
                description: 'Generate creative story ideas and opening paragraphs',
                content: 'Create a story starter for a {{genre}} story about {{theme}}.\n\nInclude:\n- Intriguing opening line\n- Main character introduction\n- Setting description\n- Initial conflict or hook',
                category: 'creative',
                tags: ['creative-writing', 'story', 'fiction'],
                isPublic: true,
                createdBy: adminUserId,
            },
            {
                name: 'SQL Query Generator',
                description: 'Generate SQL queries from natural language',
                content: 'Generate a SQL query for: {{description}}\n\nDatabase schema:\n{{schema}}\n\nProvide:\n- Optimized query\n- Explanation of what it does\n- Any indexes that might help',
                category: 'coding',
                tags: ['sql', 'database', 'query'],
                isPublic: true,
                createdBy: adminUserId,
            },
            {
                name: 'Social Media Post',
                description: 'Create engaging social media content',
                content: 'Create a {{platform}} post about {{topic}}.\n\nInclude:\n- Attention-grabbing hook\n- Value/insight\n- Relevant hashtags\n- Call to action\n\nTone: {{tone}}',
                category: 'marketing',
                tags: ['social-media', 'content', 'engagement'],
                isPublic: true,
                createdBy: adminUserId,
            },
        ];

        await Template.insertMany(initialTemplates);
        console.log(`✅ Seeded ${initialTemplates.length} initial templates`);
    }
}

export const templateService = new TemplateService();
