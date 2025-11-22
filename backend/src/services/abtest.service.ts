import { ABTest, IABTest, IVariant } from '../models/index.js';
import mongoose from 'mongoose';

export interface CreateABTestData {
    name: string;
    description?: string;
    variants: Array<{
        name: string;
        prompt: string;
    }>;
}

export interface UpdateVariantData {
    optimizedPrompt?: string;
    responseTime?: number;
    rating?: number;
    notes?: string;
}

export class ABTestService {
    async createABTest(
        userId: string | mongoose.Types.ObjectId,
        data: CreateABTestData
    ): Promise<IABTest> {
        if (data.variants.length < 2 || data.variants.length > 5) {
            throw new Error('Must have between 2 and 5 variants');
        }

        const abTest = await ABTest.create({
            userId,
            name: data.name,
            description: data.description,
            variants: data.variants.map((v) => ({
                ...v,
                createdAt: new Date(),
            })),
            status: 'draft',
        });

        return abTest;
    }

    async getABTests(
        userId: string | mongoose.Types.ObjectId,
        filters?: {
            status?: 'draft' | 'active' | 'completed';
        }
    ): Promise<IABTest[]> {
        const query: any = { userId };

        if (filters?.status) {
            query.status = filters.status;
        }

        return ABTest.find(query).sort({ createdAt: -1 }).limit(100);
    }

    async getABTestById(
        testId: string | mongoose.Types.ObjectId,
        userId?: string | mongoose.Types.ObjectId
    ): Promise<IABTest | null> {
        const query: any = { _id: testId };
        if (userId) {
            query.userId = userId;
        }

        return ABTest.findOne(query);
    }

    async updateVariant(
        testId: string | mongoose.Types.ObjectId,
        userId: string | mongoose.Types.ObjectId,
        variantName: string,
        data: UpdateVariantData
    ): Promise<IABTest | null> {
        const test = await ABTest.findOne({ _id: testId, userId });

        if (!test) {
            return null;
        }

        const variantIndex = test.variants.findIndex((v) => v.name === variantName);
        if (variantIndex === -1) {
            throw new Error('Variant not found');
        }

        // Update variant fields
        if (data.optimizedPrompt !== undefined) {
            test.variants[variantIndex].optimizedPrompt = data.optimizedPrompt;
        }
        if (data.responseTime !== undefined) {
            test.variants[variantIndex].responseTime = data.responseTime;
        }
        if (data.rating !== undefined) {
            test.variants[variantIndex].rating = data.rating;
        }
        if (data.notes !== undefined) {
            test.variants[variantIndex].notes = data.notes;
        }

        await test.save();
        return test;
    }

    async setWinner(
        testId: string | mongoose.Types.ObjectId,
        userId: string | mongoose.Types.ObjectId,
        winnerName: string
    ): Promise<IABTest | null> {
        const test = await ABTest.findOne({ _id: testId, userId });

        if (!test) {
            return null;
        }

        const variant = test.variants.find((v) => v.name === winnerName);
        if (!variant) {
            throw new Error('Variant not found');
        }

        test.winner = winnerName;
        test.status = 'completed';
        test.completedAt = new Date();

        await test.save();
        return test;
    }

    async updateABTest(
        testId: string | mongoose.Types.ObjectId,
        userId: string | mongoose.Types.ObjectId,
        data: Partial<{
            name: string;
            description: string;
            status: 'draft' | 'active' | 'completed';
        }>
    ): Promise<IABTest | null> {
        return ABTest.findOneAndUpdate(
            { _id: testId, userId },
            { $set: data },
            { new: true, runValidators: true }
        );
    }

    async deleteABTest(
        testId: string | mongoose.Types.ObjectId,
        userId: string | mongoose.Types.ObjectId
    ): Promise<boolean> {
        const result = await ABTest.deleteOne({ _id: testId, userId });
        return result.deletedCount > 0;
    }

    async getStats(userId: string | mongoose.Types.ObjectId): Promise<{
        total: number;
        draft: number;
        active: number;
        completed: number;
    }> {
        const [total, draft, active, completed] = await Promise.all([
            ABTest.countDocuments({ userId }),
            ABTest.countDocuments({ userId, status: 'draft' }),
            ABTest.countDocuments({ userId, status: 'active' }),
            ABTest.countDocuments({ userId, status: 'completed' }),
        ]);

        return { total, draft, active, completed };
    }
}

export const abTestService = new ABTestService();
