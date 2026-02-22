---
description: protocol for enforcing responsive, mobile-first design
---

# Responsive Design Protocol

Whenever you are tasked with creating a new UI component, adding a new page, or modifying the layout of EventHub, you MUST strictly adhere to the following mobile-first design principles. This ensures that the application remains fully functional and aesthetically pleasing on both mobile devices and desktop screens.

## 1. Mobile-First Approach
- Always design and implement the default TailwindCSS classes for small screens (mobile) first.
- Use `sm:`, `md:`, `lg:`, and `xl:` breakpoints to progressively enhance the UI for larger screens.
- **Example**: `flex-col md:flex-row` ensures elements stack vertically on mobile but sit side-by-side on desktop.

## 2. Layout & Spacing
- Avoid hardcoding fixed widths or heights (e.g., `w-[500px]`, `h-[800px]`) as they frequently break on small devices. 
- Prefer relative sizing (e.g., `w-full`, `max-w-md`, `h-full`, `min-h-screen`).
- Always check that complex UI elements (like modals, dropdowns, and tables) are encapsulated in scrolling containers (`overflow-x-auto`, `ScrollArea`) if they might exceed the viewport width.

## 3. Touch Targets & Interaction
- Ensure buttons and clickable areas have adequate padding for touch targets on mobile (at least `h-10 w-10` equivalent).
- Consider how hover states (`hover:`) translate to mobile (they don't exist in the same way). Focus on tap/active states and clear persistent affordances.

## 4. Testing Mental Model
- Before concluding any UI task, ask yourself: *"What happens to this interface on an iPhone SE (320px width)?"*
- If elements overlap or break out of bounds, you must refactor the flex/grid layouts immediately before notifying the user.
