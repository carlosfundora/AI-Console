## 2026-02-11 - Chat Typing Effect Optimization
**Learning:** The typing effect interval of 20ms in Chat.tsx was causing frequent state updates, leading to excessive re-renders of the entire component. Increasing it to 50ms significantly reduced render frequency without compromising perceived smoothness.
**Action:** Check animation/typing intervals in other interactive components and increase them if rendering overhead is too high.
