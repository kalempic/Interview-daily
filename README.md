# InterviewDaily

One interview question a day. You write the answer, and the app checks it against the rubric in that drill. Anything it quotes comes from the markdown notes in this repo.

This is the app as it works today. It is still in progress. Scoring and the notes run in the browser. Firebase is only Google sign-in and saving attempts. I want a real backend later. It is not in this repo yet.

## What it does

- One drill for the day, or pick another from the list
- **Get feedback** gives a score like `2/4`, plus what matched and what did not
- Up to three quotes from the notes, each linked back to the note
- After a score, you can open a sample answer for that drill
- Sign in with Google and the attempt is saved. Today then shows your last answer for that drill, how many you have saved, and a streak of days you saved something
- A notes page with search
- A few tests around the notes that ship with the app, short answers, the daily drill, and which saved answer comes back

Today and Notes work with an empty `.env`. Saving needs Firebase.

## How it works when you use it

1. Open the app. With Firebase set up and no one signed in, you get **Sign in**. Otherwise you get **Today**.
2. Google sign-in is a popup. After that the header shows your name, a saved count, and **Sign out**. The count goes to History.
3. **Today** is the drill for the local date: the question, and a short list of what an interviewer is listening for. The rubric stays hidden until you submit. **Your record** is either a sign-in prompt or your last saved answer for this drill.
4. Write a few sentences. One or two words are not scored. **Ctrl+Enter** submits, or **Cmd+Enter** on a Mac.
5. **Get feedback** scores the answer and shows note quotes. Signed in, a scored answer is written to Firestore and the record updates. **Use this answer again** puts a saved answer back in the box.
6. **History** is your attempts, newest first. Open one to see the answer, what matched, what did not, and which note headings were quoted.
7. **Notes** is the study notes. Search looks at the title, the track, and the body.
8. The footer is the version and how many note sections are indexed.

If sign-in or a save fails, the message says what to check. Switching drills clears the answer, so you do not save one question's text against another.

## How a score is decided

Nothing is sent to a model. The notes are the files in `content/`.

Each file has YAML at the top saying `drill` or `note`. Notes are split on headings. A chunk is the heading plus the text under it. The question, the title, and your answer are tokenized and compared with those chunks using TF-IDF and cosine similarity. Up to three note chunks get shown.

A rubric line is covered when enough of its content words show up in the answer. Otherwise it is missing. The label is `covered/total`. The lines you see are the rubric text, not a rewrite. The quotes are slices of the note, not a rewrite.

A very short answer gets no score, and the rubric stays hidden. A quote can still show up if the question itself matches a note.

I might later let a model rewrite the one-line summary. The score and the quotes should still come from the rubric and the notes.

## Stack

- React 19, TypeScript, Vite
- React Router
- Firebase Authentication (Google) and Cloud Firestore
- Firebase Hosting
- Vitest
- Markdown in `/content`. The notes are not in a database.

No custom server in this version. That is the piece I want to add.

## Project structure

```text
content/
  drills/          Question, checks, sample answer, rubric
  notes/           Study notes. Headings become the chunks that get quoted.
src/
  rag.ts           Parsing, TF-IDF, rubric scoring
  content.ts       Loads content/**/*.md at build time
  firebase.ts      Firebase init. Does nothing if the env vars are empty.
  auth.tsx         Google sign-in
  attempts.ts      Read and write attempts
  practice.tsx     The signed-in record
  pages/           Today, Notes, History, Sign in
  components/      Header, feedback, record, markdown
tests/             Corpus scoring and the saved-answer record
firestore.rules    A user can read and create only their own attempts
firebase.json      Hosting and Firestore
.env.example       VITE_FIREBASE_* keys
```

## Local setup

Node.js 20 or newer.

```bash
npm install
cp .env.example .env
npm run dev
npm test
```

On Windows PowerShell: `Copy-Item .env.example .env`.

Leave `.env` empty if you only want Today and Notes. Fill it in before you expect sign-in or History to work. Restart `npm run dev` after you change `.env`. Vite only reads variables that start with `VITE_`.

`npm test` runs Vitest once. It checks that each sample answer covers its own rubric and quotes a related note, that a one-word answer is not scored, that the daily drill changes the next day, and that the newest saved answer is the one shown for that drill.

`npm run build` typechecks and writes `dist/`. `npm run preview` serves that build.

## Firebase setup

Use your own project. The web config is public. The Firestore rules are what keep attempts private.

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
4. Authentication → Settings → Authorized domains. `localhost` is already there. Add the Hosting domain when you deploy, for example `your-project.web.app`.
5. Create a **Cloud Firestore** database. Use the rules in this repo, not open test mode.
6. Install the CLI and point it at the project. That writes `.firebaserc`, which still has the placeholder `your-firebase-project-id` until you do this.

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add
   ```

7. Deploy the rules before you trust History or **Your record**:

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

A signed-in user can read rows where `uid` is theirs, and can create a row only when `uid` is theirs and the fields match the rules. Updates and deletes are off. Today and History both filter on `uid` and sort in the browser, so there is no composite index. The streak is counted in the browser from `createdAt`. It is not its own field.

## Add a drill or a note

Put a `.md` file in `content/drills/` or `content/notes/`. Every markdown file under `content/` is loaded at build time. Restart the dev server if a new file does not show up.

Filename order is the daily order. Number the drills (`07-my-drill.md`) if you care where they land. The drill for a day is `dayNumber % numberOfDrills` in that sorted list.

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

- A hint. Shown before they answer.
- Keep these looser than the rubric.

## Strong answer

The sample answer. Shown only after a scored attempt.
The rubric words need to actually appear in it. The tests
expect every sample answer to cover every rubric line.

## Rubric

- One line the answer has to touch
- A second line
- A third line
- A fourth line
```

`id` and `title` are required. `kind` must be `drill`. Rubric items and the interviewer checks have to be markdown list items.

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

The explanation goes under the heading. That heading plus this
text is one chunk. Use the words you want a good answer to use.
```

`kind: note`, and an `id` that is not already a drill id. Vague headings match badly.

Keep the notes generic. No real employer names, no private stories, no confidential projects. The behavioral note is about the shape of an answer, not a made-up job history.

## Deploy

```bash
npm test
npm run build
firebase deploy --only firestore:rules,hosting
```

Hosting serves `dist/` and sends every path to `index.html`, so a refresh on `/notes` still works. After the first deploy, sign in, answer a drill, and check that the attempt is in History and in the Firestore `attempts` collection.

`firebase deploy` with no `--only` also works. There are no Cloud Functions in this version. A backend can sit next to this Hosting app later.

## Later

Not in this version:

- A backend. I want one for accounts and attempts. It is not built yet.
- No vector database, no embeddings API, no model key required
- No voice interview, no badges, no leaderboard. The streak is just days you saved an answer.
- No company-specific packs, and no page that explains the retrieval

When I get to it, still not a chat app:

- The backend mentioned above
- Maybe a model that only rewrites the one-line summary, using the rubric result and the quotes as its only source
- Edit or delete an attempt. The rules currently refuse both.
- A reminder email
- Richer markdown, if the notes outgrow headings, lists, and inline code

## Troubleshooting

- **Google window never opens.** Allow popups. The page says "Waiting for Google…" until it closes.
- **The Google window stays blank on `/__/auth/handler`.** Sign-in did not finish. Close it and try again from `localhost`. `localhost` has to be an authorized domain, and the browser has to allow cookies for the Firebase auth domain.
- **`auth/unauthorized-domain`.** Add that exact host under Authentication → Authorized domains.
- **`auth/operation-not-allowed`.** Turn on the Google provider.
- **Your record or History failed to load, or the save failed.** Deploy `firestore.rules`. You need to be signed in to the same project as `.env`.
- **A new note does not appear.** It has to be a `.md` file under `content/`, with `id`, `title`, and `kind: note`. Restart the dev server.

## License

Private portfolio project.

## Video

https://github.com/user-attachments/assets/f67c443a-a049-4871-b1a9-b9b70eb596cd
