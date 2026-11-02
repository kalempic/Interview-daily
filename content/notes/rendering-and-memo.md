---
id: rendering-and-memo
title: React rendering and memo
kind: note
track: Frontend
---

A function component is a function React calls to describe the next UI. That call is a render. A render is not the same thing as a DOM update. React can render, compare the result with the previous one, and leave the DOM alone.

## What schedules a re-render

React calls the component again in three cases. Its own state changes through `useState` or `useReducer`. Its parent renders, and children render by default when that happens. A context it reads changes. There is no fourth trigger called "props changed". New props show up because a parent rendered and passed different arguments.

If none of those three things happen, the function does not run again. That is the whole scheduling story interviewers want before any mention of memo.

## Props, state, and context

State belongs to a component position in the tree. Updating it schedules that component, and by default its children. Context lets a provider pass a value without threading props through every level. A component that calls `useContext` renders again when that provider value changes. A component that does not read the context does not re-render for that change, even if it sits under the provider.

Passing a prop is cheap to say and easy to over-explain. The parent render is the event. The prop is just the argument.

## What React.memo compares

`React.memo` wraps a component and shallow-compares the next props to the previous props with `Object.is`. If every prop is the same, React skips rendering that child. The compare is shallow. It does not open objects, arrays, or functions to look at their contents. Two objects with the same fields are still different props when they are different references.

`React.memo` does not compare state, and it does not watch context. It only answers "did the parent pass the same props?"

## State inside a memoized child

When the child updates its own state, it re-renders even if the parent passed the same props. Memo blocks a parent-driven render. It is not a freeze on the child. Effects inside the child still run when that child actually renders. Interview answers often miss this and talk as if memo caches the child forever.

## Unstable props defeat memo

A parent creates new props during its own render more often than people notice. An inline object such as a style object, an inline function, or an array built with filter or map is a new reference every time. `React.memo` then never skips the child, because the shallow compare fails.

`useMemo` and `useCallback` can keep a reference stable when their inputs stay the same. They help when a memoized child is expensive and the parent would otherwise hand it a new object or function. They are extra comparison work when the child is cheap. Adding them everywhere does not make a tree faster.

## When memo is worth it

Use `React.memo` for an expensive child whose props you can keep stable. Skip it for a cheap child. Skip it when the parent always changes the props the child actually reads. The comparison has a cost, and a tree full of memo is harder to reason about. Measure the slow child first, then memoize that boundary.

## Phrases worth keeping

A component re-renders when its state updates, when its parent re-renders, or when a context it reads changes. `React.memo` shallow-compares props and can skip the child render. The child's own state updates still re-render it. New object or function props defeat memo, so memo is for expensive children with stable props.
