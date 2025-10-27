# Manual QA Test Plan - Dashboard Phase 1

## Overview

This document outlines manual testing steps to verify the Phase 1 dashboard features implementation.

## Prerequisites

- Backend API running on http://localhost:3000
- Web dashboard running on http://localhost:3001
- Google OAuth configured
- Stripe test mode configured

## Test Scenarios

### 1. Authentication Flow

#### 1.1 Sign In

- [ ] Navigate to http://localhost:3001
- [ ] Verify landing page displays with marketing copy
- [ ] Click "Get Started Free" or "Sign in with Google"
- [ ] Complete Google OAuth flow
- [ ] Verify redirect to /dashboard after successful authentication
- [ ] Verify token is stored in localStorage and sessionStorage

#### 1.2 Unauthenticated Access

- [ ] Sign out from the application
- [ ] Try to access /dashboard directly
- [ ] Verify redirect to home page with auth_required error message
- [ ] Verify the same behavior for /pricing and /settings pages

---

### 2. Dashboard Page

#### 2.1 Initial Load

- [ ] Sign in and navigate to /dashboard
- [ ] Verify welcome message with user name
- [ ] Verify usage tracker displays in sidebar
- [ ] Verify "No prompts yet" message if history is empty

#### 2.2 Prompt History Display

**Setup:** Have some prompts saved via backend API

- [ ] Verify prompts display in cards with:
  - Optimized text
  - Timestamp
  - Tags (if present)
  - Favorite star icon
  - Copy and Share buttons
- [ ] Click "Show original prompt" and verify original text appears

#### 2.3 Search and Filters

- [ ] Enter text in search box
- [ ] Verify prompts filter based on search term
- [ ] Click favorites filter (star icon)
- [ ] Verify only favorited prompts display

#### 2.4 Prompt Actions

- [ ] Click copy button on a prompt
- [ ] Verify "Copied!" message appears
- [ ] Verify text is copied to clipboard
- [ ] Click favorite/unfavorite star icon
- [ ] Verify star fills/unfills correctly
- [ ] Click share button (if browser supports)
- [ ] Verify native share dialog appears
- [ ] Click delete button on a prompt
- [ ] Verify confirmation dialog appears
- [ ] Confirm deletion
- [ ] Verify prompt is removed from list

#### 2.5 Usage Tracker

- [ ] Verify daily usage count displays correctly
- [ ] Verify daily limit displays correctly
- [ ] Verify progress bar shows correct percentage
- [ ] Verify progress bar color:
  - Blue when < 80%
  - Yellow when 80-99%
  - Red when 100%
- [ ] Click refresh button
- [ ] Verify "Refreshing..." state appears
- [ ] Verify usage updates after refresh
- [ ] Verify monthly usage and plan display

#### 2.6 Upgrade CTA (Free Plan Only)

- [ ] Verify "Upgrade to Pro" card displays in sidebar
- [ ] Click "Upgrade Now" button
- [ ] Verify UpgradeModal opens

---

### 3. Pricing Page

#### 3.1 Page Display

- [ ] Navigate to /pricing from navbar
- [ ] Verify page title and description
- [ ] Verify Free plan card displays with:
  - $0/month pricing
  - Feature list (10 prompts/day, basic optimization, etc.)
  - Disabled "Current Plan" button
- [ ] Verify Pro plan card displays with:
  - $9.99/month pricing
  - "MOST POPULAR" badge
  - Feature list (unlimited prompts, advanced features, etc.)
  - "Upgrade to Pro" button

#### 3.2 FAQ Section

- [ ] Scroll to FAQ section
- [ ] Verify all questions display
- [ ] Read through answers
- [ ] Verify contact link at bottom

---

### 4. Upgrade Flow

#### 4.1 Initiate Upgrade

- [ ] From dashboard or pricing page, click "Upgrade" button
- [ ] Verify UpgradeModal opens with:
  - $9.99/month pricing
  - Feature list
  - "Upgrade Now" and "Cancel" buttons

#### 4.2 Stripe Checkout

- [ ] Click "Upgrade Now" in modal
- [ ] Verify redirect to Stripe Checkout
- [ ] Use test card: 4242 4242 4242 4242
- [ ] Complete checkout successfully
- [ ] Verify redirect to home page with success message
- [ ] Wait for redirect to /dashboard?upgraded=true
- [ ] Verify success banner displays on dashboard

#### 4.3 Cancel Checkout

- [ ] Start upgrade flow again
- [ ] Click browser back button or cancel in Stripe
- [ ] Verify redirect to home with canceled message
- [ ] Verify ability to try upgrade again

#### 4.4 Post-Upgrade Verification

- [ ] After successful upgrade, check usage tracker
- [ ] Verify plan shows as "PRO"
- [ ] Verify limits show as unlimited
- [ ] Navigate to settings
- [ ] Verify "Manage Subscription" button appears

---

### 5. Settings Page

#### 5.1 Account Information

- [ ] Navigate to /settings
- [ ] Verify email displays (disabled input)
- [ ] Verify name displays (disabled input)
- [ ] Verify user ID displays

#### 5.2 Subscription Section (Free Plan)

- [ ] Verify current plan shows "FREE"
- [ ] Verify usage statistics display correctly
- [ ] Verify "Upgrade to Pro" button is visible
- [ ] Click upgrade button
- [ ] Verify redirect to /pricing page

#### 5.3 Subscription Section (Pro Plan)

- [ ] (As Pro user) Verify current plan shows "PRO"
- [ ] Verify "Unlimited prompts" message
- [ ] Verify "Manage Subscription" button
- [ ] Click "Manage Subscription"
- [ ] Verify redirect to Stripe Customer Portal
- [ ] Navigate portal and verify:
  - Subscription details
  - Payment method management
  - Cancel subscription option
  - Invoice history

#### 5.4 Sign Out

- [ ] Scroll to "Account Actions" section
- [ ] Click "Sign Out" button
- [ ] Verify redirect to home page
- [ ] Verify token cleared from storage
- [ ] Try accessing /dashboard
- [ ] Verify redirect to home with auth required message

---

### 6. Navigation

#### 6.1 Navbar (Authenticated)

- [ ] Verify navbar displays on all pages
- [ ] Verify "PromptOptimizer" logo/link
- [ ] Verify "Dashboard" link
- [ ] Verify "Pricing" link
- [ ] Verify "Settings" link
- [ ] Verify usage display (on larger screens)
- [ ] Verify user avatar and name
- [ ] Verify "Sign Out" button
- [ ] Click each link and verify navigation

#### 6.2 Navbar Usage Display

- [ ] On free plan, verify usage shows: "X/10"
- [ ] Verify "Upgrade" button appears next to usage
- [ ] Click navbar upgrade button
- [ ] Verify UpgradeModal opens
- [ ] On Pro plan, verify no upgrade button

#### 6.3 Navbar (Unauthenticated)

- [ ] Sign out
- [ ] Verify only "Sign In" button shows
- [ ] Verify no dashboard/pricing/settings links

---

### 7. Error Handling

#### 7.1 API Errors

- [ ] Stop backend API
- [ ] Try to access /dashboard
- [ ] Verify error message displays
- [ ] Restart API and refresh
- [ ] Verify data loads correctly

#### 7.2 Rate Limiting

**Note:** This requires backend to have rate limiting enabled

- [ ] Make many rapid requests (use browser dev tools)
- [ ] Verify rate limit error message displays
- [ ] Wait for rate limit window to pass
- [ ] Verify functionality restores

#### 7.3 Network Errors

- [ ] Disconnect from internet
- [ ] Try to perform actions
- [ ] Verify "Network error" messages display
- [ ] Reconnect and verify recovery

---

### 8. Responsive Design

#### 8.1 Mobile View (< 640px)

- [ ] Resize browser to mobile width
- [ ] Verify navbar adapts (hamburger menu if implemented, or stacked layout)
- [ ] Verify dashboard layout stacks vertically
- [ ] Verify prompt cards are full width
- [ ] Verify usage tracker displays correctly
- [ ] Verify all buttons are tappable

#### 8.2 Tablet View (640px - 1024px)

- [ ] Resize to tablet width
- [ ] Verify 2-column grid on dashboard
- [ ] Verify navbar displays inline
- [ ] Verify modals are centered and sized appropriately

#### 8.3 Desktop View (> 1024px)

- [ ] Verify 3-column grid on dashboard
- [ ] Verify sidebar displays alongside main content
- [ ] Verify navbar shows all items inline
- [ ] Verify usage display appears in navbar

---

### 9. Edge Cases

#### 9.1 Empty States

- [ ] New user with no prompts
- [ ] Verify empty state message on dashboard
- [ ] No favorites marked
- [ ] Filter by favorites
- [ ] Verify appropriate empty state message

#### 9.2 Long Content

- [ ] Create prompt with very long text (> 1000 chars)
- [ ] Verify card displays correctly (no overflow)
- [ ] Create prompt with many tags (> 10)
- [ ] Verify tags wrap appropriately

#### 9.3 Special Characters

- [ ] Create prompt with special characters: <, >, &, quotes
- [ ] Verify proper escaping/rendering
- [ ] Search with special characters
- [ ] Verify search works correctly

#### 9.4 Quota Scenarios

- [ ] At 0/10 usage - verify UI shows no warnings
- [ ] At 8/10 usage - verify yellow progress bar
- [ ] At 10/10 usage - verify red progress bar and limit message
- [ ] As Pro user - verify no limit warnings

---

### 10. Performance

#### 10.1 Load Times

- [ ] Measure initial page load time
- [ ] Verify < 3 seconds on good connection
- [ ] Verify loading states display during data fetch

#### 10.2 Large Datasets

**Setup:** Create 50+ prompts via API

- [ ] Load dashboard
- [ ] Verify all prompts load
- [ ] Verify smooth scrolling
- [ ] Test search and filter performance

---

## Success Criteria

All test scenarios should pass with:

- ✅ No console errors
- ✅ No visual glitches or layout issues
- ✅ Appropriate loading and error states
- ✅ Smooth user experience
- ✅ Correct data display
- ✅ Working integrations with backend and Stripe

## Browser Compatibility

Test in:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Notes

- Document any bugs found with screenshots
- Note any performance issues
- Suggest UX improvements
- Verify accessibility where possible (keyboard navigation, ARIA labels)
