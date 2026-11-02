---
id: react-rendering
title: When React re-renders
kind: drill
track: Frontend
minutes: 8
---

## Question

A parent component re-renders and a child is slow. A teammate suggests wrapping the child in `React.memo`. When does a function component re-render, and when does `React.memo` actually skip that work?

## What interviewers check

- You can explain what causes a render, not only name an API.
- You know memo compares props and does not block the child's own state updates.
- You know when a new object or function makes memo useless.

## Strong answer

A function component re-renders when its own state updates, when its parent re-renders, or when a context it reads changes. Props are arguments to that render, not a separate trigger.

`React.memo` shallow-compares the next props with the previous ones using `Object.is`. If every prop is the same, React skips rendering that child. The child still re-renders if its own state updates.

Memo also fails when the parent passes a new object, array, or inline function on every render, because those props are not equal by reference. Use memo when the child is expensive and the props can stay stable. Skip it when the child is cheap or the props always change. `useMemo` and `useCallback` can hold those references steady, and they are worth adding only after you know the child render is the problem.

## Rubric

- Says a component re-renders when its state, parent, or a context it reads changes
- Explains that React.memo shallow-compares props and can skip the child render
- Notes that the child's own state updates still re-render it
- Warns that new object or function props defeat memo, so memo is for expensive children with stable props
