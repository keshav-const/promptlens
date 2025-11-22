# Razorpay Test Mode Setup Guide

## Current Issue
Error: "The id provided does not exist" when trying to upgrade to Pro plan.

**Cause**: The plan IDs in your `.env` file don't exist in your Razorpay test account.

## Solution: Create Subscription Plans in Razorpay

### Step 1: Login to Razorpay Dashboard
1. Go to https://dashboard.razorpay.com/
2. Make sure you're in **TEST MODE** (toggle in top-left corner)

### Step 2: Create Pro Monthly Plan
1. Navigate to **Subscriptions** → **Plans** in the left sidebar
2. Click **Create Plan** button
3. Fill in the details:
   - **Plan Name**: `Pro Monthly`
   - **Billing Interval**: `Monthly`
   - **Billing Amount**: `999` (₹9.99 in paise)
   - **Currency**: `INR`
   - **Description**: `Pro plan with 50 prompts per day`
4. Click **Create Plan**
5. **Copy the Plan ID** (it will look like `plan_xxxxxxxxxxxxx`)

### Step 3: Create Pro Yearly Plan
1. Click **Create Plan** again
2. Fill in the details:
   - **Plan Name**: `Pro Yearly`
   - **Billing Interval**: `Yearly`
   - **Billing Amount**: `9588` (₹95.88 in paise, which is ₹7.99/month * 12)
   - **Currency**: `INR`
   - **Description**: `Pro plan with unlimited prompts`
3. Click **Create Plan**
4. **Copy the Plan ID**

### Step 4: Update Your .env File
Open `backend/.env` and update these lines with your actual plan IDs:

```env
RAZORPAY_PRO_MONTHLY_PLAN_ID=plan_xxxxxxxxxxxxx  # Replace with your monthly plan ID
RAZORPAY_PRO_YEARLY_PLAN_ID=plan_yyyyyyyyyyyyy  # Replace with your yearly plan ID
```

### Step 5: Restart Backend Server
```bash
cd backend
# Stop the server (Ctrl+C)
npm run dev
```

## Verify Your Razorpay Configuration

Make sure these are set in your `.env`:
- ✅ `RAZORPAY_KEY_ID=rzp_test_...` (from Razorpay Dashboard → Settings → API Keys)
- ✅ `RAZORPAY_KEY_SECRET=...` (from Razorpay Dashboard → Settings → API Keys)
- ✅ `RAZORPAY_PRO_MONTHLY_PLAN_ID=plan_...` (from Step 2)
- ✅ `RAZORPAY_PRO_YEARLY_PLAN_ID=plan_...` (from Step 3)
- ⚠️ `RAZORPAY_WEBHOOK_SECRET=...` (optional for now, needed for production)

## Testing the Fix

1. Go to your web app pricing page: http://localhost:3000/pricing
2. Click "Upgrade to Pro (monthly)" or "Upgrade to Pro (yearly)"
3. You should see the Razorpay checkout modal
4. Use Razorpay test card: `4111 1111 1111 1111`, any future date, any CVV

## Troubleshooting

### Error: "The id provided does not exist"
- Make sure you copied the plan IDs correctly from Razorpay dashboard
- Ensure you're in TEST MODE in Razorpay dashboard
- Plan IDs should start with `plan_`

### Error: "Razorpay credentials are not configured"
- Check that `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in `.env`
- Make sure you're using TEST mode keys (they start with `rzp_test_`)

### Payment succeeds but plan doesn't upgrade
- This is expected in test mode without webhook configuration
- For full functionality, you'll need to set up webhooks (see RAZORPAY_INTEGRATION.md)

## Quick Reference: Razorpay Test Cards

| Card Number | Type | Result |
|-------------|------|--------|
| 4111 1111 1111 1111 | Visa | Success |
| 5555 5555 5555 4444 | Mastercard | Success |
| 4000 0000 0000 0002 | Visa | Declined |

**CVV**: Any 3 digits  
**Expiry**: Any future date  
**Name**: Any name
