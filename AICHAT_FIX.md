# AIChat Component Initialization Error Fix

## Issue
The AIChat component was throwing an error:
```
Uncaught ReferenceError: Cannot access 'sendMessageMutation' before initialization
```

## Root Cause
The error occurred because a `useEffect` hook was trying to use `sendMessageMutation` in its event handler before the mutation was defined in the component. This is a classic JavaScript temporal dead zone issue where a variable is referenced before it's declared.

## Solution
The fix involved reordering the code to ensure `sendMessageMutation` is defined before it's used:

1. Removed the problematic `useEffect` that was placed before `sendMessageMutation` definition
2. Moved the event listener for news analysis requests to after `handleDeepAnalysis` function
3. The event listener now properly accesses `sendMessageMutation` after it's been created by `useMutation`

## Technical Details
- The `sendMessageMutation` is created using `useMutation` from React Query
- The event listener listens for 'openAIChat' events dispatched from the MarketNews component
- When news articles are selected for AI analysis, the event contains the message and article context
- The handler opens the chat window and sends the analysis request with the news context

## Impact
This fix allows the news AI analysis feature to work properly without initialization errors, enabling users to:
- Select multiple news articles for batch analysis
- Get AI insights on market news
- Toggle between simple and deep analysis modes 