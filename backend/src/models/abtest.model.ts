import mongoose, { Document, Schema } from 'mongoose';

export interface IVariant {
    name: string;
    prompt: string;
    optimizedPrompt?: string;
    responseTime?: number;
    rating?: number;
    notes?: string;
    createdAt: Date;
}

export interface IABTest extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    variants: IVariant[];
    winner?: string;
    status: 'draft' | 'active' | 'completed';
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}

const variantSchema = new Schema<IVariant>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        prompt: {
            type: String,
            required: true,
        },
        optimizedPrompt: {
            type: String,
        },
        responseTime: {
            type: Number,
            min: 0,
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
        },
        notes: {
            type: String,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

const abTestSchema = new Schema<IABTest>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            maxlength: 500,
        },
        variants: {
            type: [variantSchema],
            validate: {
                validator: (variants: IVariant[]) => variants.length >= 2 && variants.length <= 5,
                message: 'Must have between 2 and 5 variants',
            },
        },
        winner: {
            type: String,
        },
        status: {
            type: String,
            enum: ['draft', 'active', 'completed'],
            default: 'draft',
        },
        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
abTestSchema.index({ userId: 1, createdAt: -1 });
abTestSchema.index({ status: 1 });

export const ABTest = mongoose.model<IABTest>('ABTest', abTestSchema);
