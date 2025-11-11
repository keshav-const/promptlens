import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { User } from '../models/index.js';

/**
 * Migration script to reset legacy Stripe users to free plan and remove Stripe fields
 * This should be run once when migrating from Stripe to Razorpay
 */
export async function migrateStripeToRazorpay(): Promise<void> {
  try {
    if (!config.MONGODB_URI) {
      console.log('MongoDB not configured, skipping migration');
      return;
    }

    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB for migration');

    // Reset all users with Stripe fields to free plan and remove Stripe data
    const result = await User.updateMany(
      {
        $or: [
          { stripeCustomerId: { $exists: true } },
          { stripeSubscriptionId: { $exists: true } },
          { plan: 'pro' } // Legacy pro plan
        ]
      },
      {
        $set: {
          plan: 'free',
          usageCount: 0,
          lastResetAt: new Date()
        },
        $unset: {
          stripeCustomerId: 1,
          stripeSubscriptionId: 1
        }
      }
    );

    console.log(`Migration completed. Updated ${result.modifiedCount} users`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateStripeToRazorpay()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}