---
id: component-tests
title: Testing what users can do
kind: note
track: Frontend
---

A component test is a small script that renders the UI and checks a behavior. The useful ones survive a refactor. The brittle ones fail because a helper was renamed.

## Behavior over implementation

Assert visible behavior and the result of user actions. If a person can see the text "Saved" after pressing Save, the test can look for that text. If a person can open a dialog, the test can look for the dialog. Do not assert that a particular function was called inside the component, and do not read React state to decide whether the feature works. Those details are free to change.

A test that renders, clicks, and checks the screen describes the product. A test that imports a private helper describes the file you happen to have today.

## Queries that match the accessible UI

Prefer role and accessible-name queries. `getByRole('button', { name: 'Save' })` finds the same control a keyboard user finds, and it fails if you remove the name or the role. `getByLabelText` fits form fields. `getByText` fits status messages and static copy.

A `data-testid` is an escape hatch for when there is no accessible handle, such as a decorative layout wrapper you truly must select. It should not be the default. Tests that only use test ids keep passing after you break the accessible name.

Prefer role and accessible-name queries over test ids or internal state.

## What should not fail the test

An internal refactor should not break the test. Renaming a helper, splitting a hook, or replacing `useState` with `useReducer` is not a behavior change. If the test fails anyway, the test was coupled to the implementation. That is the signal to rewrite the assertion, not to put the old function name back.

Changing the accessible name, removing a button, or altering what a click does should fail the test. Those are behavior changes. The test is doing its job.

## Success, empty, and error

Cover a success path and an empty or error path. The success path is the one from the ticket. The empty path is the screen with no rows. The error path is the screen after a failed request. A single happy-path test leaves the states users actually get stuck in unchecked.

You do not need every permutation. You need the paths a person can reach, with the copy and the action each path offers.

## What to mock

Mock the network boundary. Return a successful payload in one test and a failure in another. Do not mock child components you own, or the test no longer renders the UI you ship. Mock a heavy external dependency, such as a map or a video player, when rendering the real one is slow or needs a browser you do not have. Keep the mock at the edge.

Mocks that replace the component under test, or that assert the order of internal calls, drift into implementation tests. They fail during ordinary cleanups and they do not catch a broken button.
