# PromptLens Extension - Manual Testing Checklist

## Prerequisites
- Extension built and loaded in Chrome (`npm run build` then load from `chrome://extensions`)
- Backend API running on configured URL (default: `http://localhost:3000`)
- Valid auth token set in extension storage (obtained from dashboard login)

## ChatGPT Testing

### Textarea Detection
- [ ] Navigate to https://chat.openai.com or https://chatgpt.com
- [ ] Wait for page to fully load
- [ ] Click on the main textarea/input area
- [ ] **Expected**: "✨ Optimize with PromptLens" button appears near the textarea
- [ ] Scroll the page
- [ ] **Expected**: Button repositions to stay near textarea

### Optimization Flow - With Auth Token
- [ ] Type a simple prompt in the textarea (e.g., "Write a poem")
- [ ] Click the "✨ Optimize with PromptLens" button
- [ ] **Expected**: Modal opens showing loading state
- [ ] **Expected**: After a few seconds, modal shows three tabs: Original, Optimized, Explanation
- [ ] Click through each tab
- [ ] **Expected**: Original shows your input, Optimized shows improved version, Explanation shows reasoning

### Replace Action
- [ ] With optimization modal open, click "Replace" button
- [ ] **Expected**: Modal closes
- [ ] **Expected**: Textarea now contains the optimized prompt
- [ ] **Expected**: Events are dispatched (form should recognize the change)

### Copy Action
- [ ] Optimize a prompt and open modal
- [ ] Click "Copy" button
- [ ] **Expected**: Button briefly shows "✓ Copied"
- [ ] Paste elsewhere (Ctrl+V or Cmd+V)
- [ ] **Expected**: Optimized prompt is pasted

### Save Action
- [ ] Optimize a prompt and open modal
- [ ] Click "Save" button
- [ ] **Expected**: Button shows "Saving..." then "✓ Saved"
- [ ] Check browser console for success message

### Empty Prompt Error
- [ ] Clear textarea (make it empty)
- [ ] Click optimize button
- [ ] **Expected**: Modal opens showing error message about empty prompt

### Missing Auth Token
- [ ] Open Chrome DevTools console
- [ ] Run: `chrome.storage.local.remove(['promptlens_auth_token'])`
- [ ] Type a prompt and click optimize
- [ ] **Expected**: Modal shows error message asking user to sign in via dashboard
- [ ] **Expected**: Error message mentions authentication required

### Rate Limit Handling (429)
- [ ] Make multiple rapid optimization requests (>10 in quick succession)
- [ ] **Expected**: Eventually get a modal showing rate limit error
- [ ] **Expected**: Modal remains open with clear message
- [ ] **Expected**: Can close modal and retry later

### Network Error Handling
- [ ] Stop the backend server
- [ ] Try to optimize a prompt
- [ ] **Expected**: Modal shows error with helpful message
- [ ] Start backend server again
- [ ] **Expected**: Can retry successfully

### Close Modal
- [ ] Open optimization modal
- [ ] Click X button in top-right
- [ ] **Expected**: Modal closes
- [ ] Click optimize again
- [ ] **Expected**: Modal opens fresh (no old data)
- [ ] Open modal again
- [ ] Click outside the modal (on the dark overlay)
- [ ] **Expected**: Modal closes

## Google Gemini Testing

### Textarea Detection
- [ ] Navigate to https://gemini.google.com
- [ ] Wait for page to fully load
- [ ] Click on the input area (contenteditable or textarea)
- [ ] **Expected**: "✨ Optimize with PromptLens" button appears
- [ ] Test that button repositions on scroll

### Basic Optimization Flow
- [ ] Enter a prompt
- [ ] Click optimize button
- [ ] **Expected**: Same behavior as ChatGPT
- [ ] Test Replace, Copy, and Save actions
- [ ] **Expected**: All work correctly with Gemini's input field

### Dynamic Content
- [ ] Refresh the Gemini page
- [ ] Wait for various stages of loading
- [ ] **Expected**: Button eventually appears when input is ready
- [ ] Navigate to a new chat
- [ ] **Expected**: Button still works in new chat

## Multi-Tab Testing

### Multiple ChatGPT Tabs
- [ ] Open 2-3 ChatGPT tabs
- [ ] Click textarea in each tab
- [ ] **Expected**: Each shows its own optimize button
- [ ] Optimize in one tab
- [ ] **Expected**: Doesn't affect other tabs
- [ ] Check for memory leaks (open DevTools Memory profiler)

### Tab Navigation
- [ ] Optimize a prompt (modal open)
- [ ] Switch to another tab
- [ ] Switch back
- [ ] **Expected**: Modal still correctly positioned and functional

## Memory & Cleanup Testing

### Extension Reload
- [ ] With optimize button visible, reload extension from `chrome://extensions`
- [ ] **Expected**: Old button/modal removed
- [ ] **Expected**: New button appears after page interaction

### Navigation
- [ ] With modal open, navigate to a different page
- [ ] **Expected**: Modal closes/cleans up
- [ ] Return to chat page
- [ ] **Expected**: Can use feature again without issues

### Long Session
- [ ] Use the extension for several optimizations (10+)
- [ ] Open DevTools Memory tab
- [ ] Take heap snapshot
- [ ] **Expected**: No significant memory leaks (DOM nodes not accumulating)

## Edge Cases

### Very Long Prompts
- [ ] Enter a very long prompt (1000+ characters)
- [ ] Optimize
- [ ] **Expected**: Handles gracefully, modal scrollable

### Special Characters
- [ ] Enter prompt with emojis: "Write a story 🚀 🌟"
- [ ] Optimize
- [ ] **Expected**: Characters preserved correctly

### Rapid Clicks
- [ ] Click optimize button multiple times quickly
- [ ] **Expected**: Only one modal opens
- [ ] **Expected**: No duplicate requests

### Multiple Textareas
- [ ] If page has multiple textareas, focus different ones
- [ ] **Expected**: Button follows the active textarea
- [ ] **Expected**: Optimizes content from the focused textarea

## Console Log Verification

Open browser console (DevTools) and verify clean logging:

- [ ] No error messages in console during normal operation
- [ ] See "PromptLens content script loaded" on page load
- [ ] See platform detection log
- [ ] See optimization success/failure logs when appropriate
- [ ] No "Failed to load resource" errors

## Accessibility

### Keyboard Navigation
- [ ] Tab to the optimize button
- [ ] Press Enter
- [ ] **Expected**: Modal opens
- [ ] Tab through modal buttons
- [ ] Press Escape key
- [ ] **Expected**: Modal closes (if implemented)

### Screen Reader
- [ ] Enable screen reader
- [ ] Navigate to optimize button
- [ ] **Expected**: Button label is announced clearly

## Cross-Browser Testing (Chrome/Edge)

- [ ] Test in Chrome
- [ ] Test in Edge (Chromium-based)
- [ ] **Expected**: Identical behavior

## Performance

### Load Time
- [ ] Measure: Does extension slow down page load?
- [ ] **Expected**: Minimal impact (<100ms)

### Button Rendering
- [ ] Time from focus to button appearance
- [ ] **Expected**: <200ms

### Optimization Response
- [ ] Time from click to result displayed
- [ ] **Expected**: Depends on backend but shows loading state immediately

## Summary Checklist

- [ ] All ChatGPT tests pass
- [ ] All Gemini tests pass
- [ ] No console errors
- [ ] No memory leaks
- [ ] Auth flow works correctly
- [ ] Error handling is user-friendly
- [ ] Replace/Copy/Save actions work
- [ ] Modal UI is responsive and accessible
- [ ] Button positioning is correct
- [ ] Extension cleans up properly on navigation

## Notes

Record any issues found during testing:

```
Issue 1: [Description]
Steps to reproduce: [Steps]
Expected: [Expected behavior]
Actual: [Actual behavior]
```

## Sign-off

Tester: _______________
Date: _______________
Version: _______________
Status: [ ] PASS [ ] FAIL
