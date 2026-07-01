# Interview Question Cards

A static GitHub Pages flashcard app for interview preparation. Cards are grouped by topic, can be studied in order or shuffled, and progress is stored in the browser with `localStorage`.

## Features

- Click or tap a card to flip between question and answer.
- Mark each card as `Know`, `Review`, or leave it `New`.
- Filter by topic or study all topics together.
- Switch between ordered and random card sequences.
- Edit questions in `data/questions.json`.

## Run Locally

Serve the folder with any static web server:

```powershell
python -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## Add Questions

Add cards to `data/questions.json`:

```json
{
  "id": "topic-id",
  "name": "Topic Name",
  "description": "Short topic description",
  "cards": [
    {
      "id": "topic-001",
      "question": "Question text",
      "answer": "Answer text"
    }
  ]
}
```

Use stable `id` values so saved progress remains connected to the same cards.

## Deploy With GitHub Pages

1. Push this repository to GitHub.
2. Open the repository on GitHub and go to `Settings` > `Pages`.
3. Under `Build and deployment`, choose `Deploy from a branch`.
4. Select the default branch, choose `/root`, then save.

The app uses relative paths, so it works from a repository page URL such as:

```text
https://shaunsukgyukoh.github.io/interview_questions/
```
