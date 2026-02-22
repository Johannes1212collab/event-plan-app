---
description: Protocol for adding a new feature to the application
---

# Feature Addition Protocol

When you (the AI agent) are tasked with adding a new feature to the EventHub application, you **MUST** follow this protocol to ensure that the new feature is introduced to the users via the existing Onboarding Tour.

## 1. Feature Implementation
- Develop the feature as requested by the user.
- Ensure all components, server actions, and schema updates are fully implemented and SOLID-compliant.

## 2. UI Hooking
- Ensure the newly added UI component has a unique, descriptive `#id` tag assigned to its root element.
- This `#id` will be used as the anchor point for the `driver.js` onboarding tooltip.

## 3. Onboarding Tour Integration
- Open `src/components/onboarding-tour.tsx`.
- Locate the relevant tour array based on where the new feature resides (`page === "dashboard"`, `page === "discover"`, or the fallback `event` page array).
- Add a new step object to the `steps` array for that page.
- The step object MUST follow this format:
```javascript
{
    element: "#[YOUR_NEW_ELEMENT_ID]",
    popover: {
        title: "[Brief, Catchy Title for the Feature]",
        description: "[1-2 sentence explanation of what the feature does and how to use it.]",
        side: "bottom", // or "top", "left", "right" depending on UI layout
        align: "start",
    }
}
```

## 4. Verification
- Verify that the `onboarding-tour.tsx` file compiles correctly.
- Add the onboarding step update to your `task.md` checklists to ensure you don't forget it before completing a task.
