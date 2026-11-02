# InterviewDaily

Daily interview practice. Answer drills, get feedback grounded in your markdown notes. React, TypeScript, Vite, Firebase, Vitest.

InterviewDaily is a focused practice tool for interview prep. Each day you get one question, you write the answer you would say out loud, and the app scores that answer against a rubric. The score is a simple count of key points. Supporting passages are copied from study notes in this repo. It is not a chatbot, and it does not call an external language model.

Suggested GitHub description:

> Daily interview practice. Answer drills, get feedback grounded in your markdown notes. React, TypeScript, Vite, Firebase, Vitest.

## Features

- Google sign-in through Firebase Authentication
- A daily drill, plus a picker when you want a different question
- An answer box with one primary action: **Get feedback**
- A score such as `2/4`, with covered points and missing points taken from the drill rubric
- One to three short excerpts from your markdown notes, linked back to the source note
- A reference “strong answer” you can open after you have been scored
- History of scored attempts in Cloud Firestore, visible only to the signed-in user
- A notes browser with search
- Vitest coverage for parsing, retrieval, and rubric scoring
- Firebase Hosting config so the same build can be deployed

You can practice and read notes before Firebase is configured. Attempts are saved only after sign-in.

## How the app behaves

1. Open the app. If Firebase is configured and you are signed out, you land on **Sign in**. Otherwise you land on **Today**.
2. **Sign in** uses a Google popup. Afterward the header shows your name and **Sign out**.
3. **Today** shows the drill scheduled for the local date, the question, and a short list of what interviewers check. The rubric stays hidden until you submit.
4. Write an answer. A few words are not scored. A short paragraph is enough. **Ctrl+Enter** submits.
5. **Get feedback** compares the answer with the rubric and shows note excerpts. If you are signed in and the answer was scored, the attempt is written to Firestore.
6. **History** lists your attempts, newest first. Each one expands to the answer, the covered and missing points, and the note headings that were cited.
7. **Notes** lists the study notes. Search matches the title, track, and body. Open a note to read it.
8. The footer shows the app version and how many note chunks are indexed.

Empty, loading, and error states use plain English. If Google sign-in or a save fails, the message says what to check.

Switching drills clears the answer and the feedback so you do not save one question’s text against another question.

## How feedback stays grounded

Feedback is computed in the browser. Nothing is sent to an LLM.

1. Markdown files in `content/` are bundled with the app.
2. Each file’s YAML frontmatter says whether it is a `drill` or a `note`.
3. Notes are split into chunks on markdown headings. A chunk is one heading plus the text under it.
4. The question, the drill title, and your answer are turned into tokens. Chunks are ranked with TF-IDF and cosine similarity. The top one to three note chunks above a small similarity floor are shown.
5. Each rubric bullet is scored the same way: content words in the bullet are compared with content words in your answer. A bullet is either covered or missing. The score label is `covered/total`.
6. Covered and missing lines are the rubric text, unchanged. Snippets are excerpts of the note text, unchanged. The app does not invent employers, projects, or metrics.

If the answer is too short, there is no score and the rubric is not listed yet. Passages can still appear when the question itself matches a note.

A later version can replace the short headline sentences with an LLM. Retrieval and the rubric check should stay as they are, so the model is only phrasing a result that is already grounded.

## Tech stack

- React 19, TypeScript, Vite
- React Router
- Firebase Authentication (Google) and Cloud Firestore
- Firebase Hosting
- Vitest
- Markdown corpus in `/content` (no database for notes)

There is no custom backend. NestJS and Next.js are intentionally not part of this MVP.

## Project structure

```text
content/
  drills/          Interview questions, checks, strong answer, rubric
  notes/           Study notes. Headings become retrieval chunks.
src/
  rag.ts           Parsing, TF-IDF retrieval, rubric scoring, feedback
  content.ts       Loads content/**/*.md at build time
  firebase.ts      Firebase init. Stays idle when env vars are missing.
  auth.tsx         Google sign-in state
  attempts.ts      Read and write the attempts collection
  pages/           Today, Notes, History, Sign in
  components/      Header, feedback, markdown view
tests/             Unit tests for rag.ts and the shipped corpus
firestore.rules    Users can read and create only their own attempts
firebase.json      Hosting + Firestore config
.env.example       VITE_FIREBASE_* keys
```

## Local setup

Requirements: Node.js 20 or newer.

```bash
npm install
cp .env.example .env
npm run dev
npm test
```

On Windows PowerShell, copy the env file with `Copy-Item .env.example .env`.

Leave `.env` empty if you only want to try Today and Notes. Fill it in before you expect Google sign-in or History to work. Restart `npm run dev` after changing `.env`. Vite only exposes variables that start with `VITE_`.

`npm test` runs Vitest once. It checks heading chunks, retrieval ranking, rubric scoring, and that every shipped strong answer covers its own rubric and cites a related note.

`npm run build` typechecks and writes `dist/`. `npm run preview` serves that build.

## Firebase setup

Use a project you control. The Firebase web config is public by design. Firestore rules are what keep attempts private.

1. Create a project in the [Firebase console](https://console.firebase.google.com/).
2. Add a **Web app** and copy the config into `.env`:

   | Env var | Config field |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

3. Authentication → Sign-in method → enable **Google**.
4. Authentication → Settings → Authorized domains. `localhost` is there by default. Add your Hosting domain when you deploy (for example `your-project.web.app`).
5. Create a **Cloud Firestore** database. The rules file in this repo expects production rules, not open test mode.
6. Install the CLI and select the project. This updates `.firebaserc`, which currently contains the placeholder `your-firebase-project-id`.

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   ```

7. Deploy the rules before you rely on History:

   ```bash
   firebase deploy --only firestore:rules
   ```

### Attempt documents

Collection: `attempts`.

| Field | Type |
| --- | --- |
| `uid` | string, the signed-in user |
| `drillId` | string |
| `answer` | string |
| `scoreLabel` | string, such as `2/4` |
| `covered` | string array, rubric lines that matched |
| `missing` | string array, rubric lines that did not |
| `hitHeadings` | string array, `Note title — heading` |
| `createdAt` | server timestamp |

Rules allow a signed-in user to read documents whose `uid` is their own, and to create a document only when `uid` is their own and the shape matches. Updates and deletes are denied. The History query filters on `uid` and sorts in the browser, so you do not need a composite index.

## Add a drill or a note

Drop a `.md` file in `content/drills/` or `content/notes/`. The app loads every markdown file under `content/` at build time. Restart the dev server if the new file does not show up.

Filename order is the daily rotation order. Prefix drills with numbers (`07-my-drill.md`) if you care where they land in the schedule. The drill for a calendar day is `dayNumber % numberOfDrills` in that sorted order.

### Drill

```markdown
---
id: my-drill-id
title: Short title
kind: drill
track: Frontend
minutes: 8
---

## Question

The question, in one or two paragraphs.

## What interviewers check

- A hint. This is shown before they answer.
- Keep these more general than the rubric.

## Strong answer

The reference answer. It is revealed only after a scored attempt.
Write it so the rubric words actually appear. The tests expect every
strong answer to cover every rubric bullet.

## Rubric

- One checklist line the answer must touch
- A second line
- A third line
- A fourth line
```

`id` and `title` are required. `kind` must be `drill`. Rubric items and interviewer checks must be markdown list items.

### Note

```markdown
---
id: my-note-id
title: Note title
kind: note
track: Frontend
---

A short intro.

## A heading that can be cited

Write the explanation under the heading. That heading plus this text
is one retrieval chunk. Use the same terms you want a good answer to use.
```

Use `kind: note` and a unique `id`. Do not reuse a drill id. Headings should be specific. A vague heading retrieves poorly.

Keep the corpus generic. Do not add real employer names, private incidents, or confidential project details. Behavioral notes should teach the shape of an answer, not invent a personal history.

## Deploy

```bash
npm test
npm run build
firebase deploy --only firestore:rules,hosting
```

Hosting serves `dist/` and rewrites every path to `index.html`, so client-side routes work on refresh. After the first deploy, open the Hosting URL, sign in, answer a drill, and confirm the attempt appears in History and in the Firestore `attempts` collection.

`firebase deploy` without `--only` also works. There are no Cloud Functions in this repo.

## Roadmap / out of scope for v1

In this version, on purpose:

- No NestJS or other custom server
- No vector database and no embeddings API
- No required OpenAI, Anthropic, or other LLM key
- No voice interview
- No streaks, badges, or leaderboards
- No company-specific question packs
- No separate screen that teaches how retrieval works

Possible later, without changing the product into a chat app:

- Optional LLM pass that only rewrites the headline, using the rubric result and the retrieved excerpts as the only source
- Edit or delete an attempt (rules currently deny both)
- A scheduled email or reminder
- Richer markdown in notes, if the corpus grows past headings, lists, and inline code

## Troubleshooting

- **Google window never opens.** Allow popups. The button stays on “Waiting for Google…” until the popup closes.
- **`auth/unauthorized-domain`.** Add the exact host in Firebase Authentication → Authorized domains.
- **`auth/operation-not-allowed`.** Enable the Google provider.
- **History says it could not load, or saving fails.** Deploy `firestore.rules`. Confirm you are signed in with the same project as `.env`.
- **A new note does not appear.** It must be a `.md` file under `content/`, with `id`, `title`, and `kind: note`. Restart Vite.

## License

Private portfolio project. Add a license before you accept outside contributions.
