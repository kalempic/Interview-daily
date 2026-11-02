---
id: form-validation
title: Form validation that helps
kind: drill
track: Frontend
minutes: 7
---

## Question

A signup form paints a red border and the word "Invalid" under the email field as soon as the page loads, before the user has typed. What is wrong with that, and how should validation behave instead?

## What interviewers check

- You care about when an error appears, not only that it appears.
- The message tells the user how to fix the field.
- The error is tied to the input for assistive technology.

## Strong answer

Do not show an error for an empty field before the user has edited it or tried to submit. Validate on submit, and validate on blur after the field has been touched. Keep the message visible while they fix the value, and clear it once the value is valid.

Write a message that names the fix, such as "Enter an email like name@example.com", not only "Invalid". Connect that message to the input with `aria-describedby`, and set `aria-invalid` while the error is showing. On submit, move focus to the first invalid field.

Disable the submit button only while a request is in flight, not because the form is still empty. An empty form should still submit so the user can see the errors.

## Rubric

- Waits until blur or submit before showing an error on an untouched field
- Writes a message that explains how to fix the field
- Connects the error with aria-describedby and aria-invalid
- Moves focus to the first invalid field and does not disable submit only because fields are empty
