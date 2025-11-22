import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { templateService } from '../services/template.service.js';
import { User } from '../models/index.js';

async function seedTemplates() {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find or create an admin user for seeding
        let adminUser = await User.findOne({ email: 'admin@promptlens.com' });

        if (!adminUser) {
            adminUser = await User.create({
                email: 'admin@promptlens.com',
                displayName: 'PromptLens Admin',
                plan: 'free',
                usageCount: 0,
                lastResetAt: new Date(),
            });
            console.log('✅ Created admin user for seeding');
        }

        // Seed initial templates
        await templateService.seedInitialTemplates(adminUser._id);

        console.log('✅ Template seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding templates:', error);
        process.exit(1);
    }
}

seedTemplates();
