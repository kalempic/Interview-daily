---
id: empty-error-states
title: Empty, loading, and error states
kind: drill
track: Frontend
minutes: 7
---

## Question

A list page renders nothing while data is loading, renders a blank card when the list is empty, and shows a raw error string when the request fails. How should loading, empty, and error behave?

## What interviewers check

- You treat loading, empty, success, and error as different states.
- An empty screen tells the user what to do next.
- A failure is understandable and offers a way to retry.

## Strong answer

Keep loading, empty, success, and error as separate UI. Loading should reserve space and say that the data is on the way, and it must not look like an empty list or the user will think they have no items.

An empty list should explain that there is nothing yet and offer the next action, such as creating the first item. An error should use plain language, hide the stack trace, and give a retry action. If the failure is only in one region, leave the rest of the page usable. Do not invent rows to fill an empty screen.

## Rubric

- Separates loading, empty, success, and error
- Uses a loading state that does not look like an empty list
- Gives the empty state an explanation and a next action
- Shows a plain-language error with a retry and no stack trace
