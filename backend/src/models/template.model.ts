import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
    isPublic: boolean;
    createdBy: mongoose.Types.ObjectId;
    usageCount: number;
    rating: number;
    createdAt: Date;
    updatedAt: Date;
}

const templateSchema = new Schema<ITemplate>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            required: true,
            maxlength: 500,
        },
        content: {
            type: String,
            required: true,
            maxlength: 5000,
        },
        category: {
            type: String,
            required: true,
            enum: ['coding', 'writing', 'marketing', 'business', 'education', 'creative', 'other'],
            default: 'other',
        },
        tags: {
            type: [String],
            default: [],
            validate: {
                validator: (tags: string[]) => tags.length <= 10,
                message: 'Maximum 10 tags allowed',
            },
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        usageCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
templateSchema.index({ category: 1, isPublic: 1 });
templateSchema.index({ createdBy: 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ name: 'text', description: 'text', tags: 'text' });

export const Template = mongoose.model<ITemplate>('Template', templateSchema);
