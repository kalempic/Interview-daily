---
id: testing-behavior
title: Testing behavior, not implementation
kind: drill
track: Frontend
minutes: 8
---

## Question

A React test fails after you rename an internal helper and change a `data-testid`, even though the screen still works the same way. What should a component test assert, and which queries should it use?

## What interviewers check

- You describe behavior a person can see or operate.
- You know why tests tied to internals are brittle.
- You can name a query that matches an accessible control.

## Strong answer

Assert what a user can observe: the text on the screen, the role of a control, and what changes after an action such as a click or submit. Prefer `getByRole` with an accessible name, for example the Save button, over a test id or a look at internal state.

Renaming a helper or rewriting state should not fail the test when the behavior stayed the same. Use a `data-testid` only when there is no accessible handle. Cover the success path and one empty or error path the user can actually hit. Mock the network boundary. Do not mock child components unless that child is a heavy external dependency you do not own.

## Rubric

- Asserts visible behavior and the result of user actions
- Prefers role and accessible-name queries over test ids or internal state
- Explains that an internal refactor should not break the test
- Covers a success path and an empty or error path, and mocks the network boundary
