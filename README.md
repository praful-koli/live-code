# Contributing to live-code

Welcome! This guide explains how to set up the project locally, create your own branch, and submit your work — without ever pushing directly to `main`.

> **Rule #1 — Never push to `main`.** All changes go through a feature branch and a Pull Request.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Branch Naming Convention](#branch-naming-convention)
- [Workflow Step by Step](#workflow-step-by-step)
- [Keeping Your Branch Up to Date](#keeping-your-branch-up-to-date)
- [Opening a Pull Request](#opening-a-pull-request)
- [Commit Message Guide](#commit-message-guide)
- [Project Structure](#project-structure)
- [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Check |
|---|---|---|
| Node.js | >= 18.x | `node -v` |
| npm | >= 9.x | `npm -v` |
| Git | >= 2.x | `git --version` |

---

## Getting Started

### 1. Fork the repository

Go to [https://github.com/praful-koli/live-code](https://github.com/praful-koli/live-code) and click the **Fork** button (top right). This creates your own copy of the repo under your GitHub account.

### 2. Clone your fork

```bash
git clone https://github.com/<your-username>/live-code.git
cd live-code
```

### 3. Add the original repo as upstream

This lets you pull in future changes from the main repo.

```bash
git remote add upstream https://github.com/praful-koli/live-code.git
```

Verify your remotes:

```bash
git remote -v
# origin    https://github.com/<your-username>/live-code.git (fetch)
# origin    https://github.com/<your-username>/live-code.git (push)
# upstream  https://github.com/praful-koli/live-code.git (fetch)
# upstream  https://github.com/praful-koli/live-code.git (push)
```

### 4. Install dependencies

```bash
cd server
npm install
```

### 5. Set up environment variables

```bash
cp .env.example .env
```

Fill in the required values in `.env` (database URL, JWT secret, etc.).

### 6. Start the development server

```bash
npm run dev
```

---

## Branch Naming Convention

Always create a new branch for every feature, fix, or task. Never work directly on `main`.

Use this format:

```
<type>/<short-description>
```

| Type | When to use | Example |
|---|---|---|
| `feat` | Adding new functionality | `feat/google-oauth` |
| `fix` | Fixing a bug | `fix/score-update-socket` |
| `refactor` | Restructuring code without changing behaviour | `refactor/match-service` |
| `docs` | Documentation only | `docs/api-routes` |
| `chore` | Config, deps, tooling | `chore/update-packages` |
| `test` | Adding or fixing tests | `test/auth-middleware` |

**Examples:**

```bash
feat/live-scoring
fix/jwt-expiry-bug
docs/contributing-guide
refactor/player-stats-module
```

---

## Workflow Step by Step

### Step 1 — Sync with main before you start

Always pull the latest changes from the original repo before creating a branch.

```bash
git checkout main
git pull upstream main
```

### Step 2 — Create your branch

```bash
git checkout -b feat/your-feature-name
```

You are now on your new branch. Confirm with:

```bash
git branch
# * feat/your-feature-name
#   main
```

### Step 3 — Make your changes

Write your code. Keep commits small and focused — one logical change per commit.

### Step 4 — Stage and commit

```bash
git add .
git commit -m "feat: add live scoring via socket.io"
```

See the [Commit Message Guide](#commit-message-guide) below.

### Step 5 — Push your branch to your fork

```bash
git push origin feat/your-feature-name
```

> ⚠️ **Never run** `git push origin main`. If you accidentally do, stop and ask for help before doing anything else.

---

## Keeping Your Branch Up to Date

If `main` gets new commits while you are working, rebase your branch on top of them:

```bash
git checkout main
git pull upstream main

git checkout feat/your-feature-name
git rebase main
```

If there are conflicts, Git will pause and show you which files conflict. Resolve them, then:

```bash
git add <resolved-file>
git rebase --continue
```

After rebasing, force-push your branch:

```bash
git push origin feat/your-feature-name --force-with-lease
```

---

## Opening a Pull Request

1. Go to your fork on GitHub: `https://github.com/<your-username>/live-code`
2. GitHub will show a banner — click **Compare & pull request**
3. Set the base to `praful-koli/live-code` → `main`
4. Fill in the PR description:

```
## What does this PR do?
Brief description of the change.

## Related issue
Closes #<issue-number> (if applicable)

## How to test
Steps to verify the change works.
```

5. Click **Create pull request**
6. Wait for review — do not merge your own PR unless you are the repo owner

---

## Commit Message Guide

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <short summary in present tense>
```

**Types:**

| Type | Description |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation change |
| `refactor` | Code restructure, no behaviour change |
| `chore` | Tooling, deps, config |
| `test` | Tests added or fixed |

**Good examples:**

```bash
feat: add player stats endpoint
fix: resolve socket disconnect on match end
docs: update API route documentation
refactor: extract scoring logic into service layer
chore: upgrade mongoose to v8
```

**Bad examples:**

```bash
fix stuff          # too vague
WIP                # not a real commit message
updated code       # meaningless
```

---

## Project Structure

```
live-code/
└── server/
    └── src/
        ├── config/          # App config, DB connection, logger
        ├── constants/        # HTTP status codes, app constants
        ├── middlewares/      # Error handler, security middleware
        ├── modules/          # Feature modules (auth, match, player, etc.)
        ├── routes/           # Top-level route registration
        ├── shared/
        │   ├── error/        # ApiError class
        │   └── utils/        # ApiResponse, asyncHandler, jwt, bcrypt, etc.
        ├── app.js
        └── server.js
```

When adding a new feature, create a folder under `modules/` and follow the existing pattern (controller → service → route → model).

---

## Common Mistakes to Avoid

| Mistake | What to do instead |
|---|---|
| Pushing directly to `main` | Always work on a feature branch |
| Committing `.env` files | Add `.env` to `.gitignore`, never commit secrets |
| Huge commits with everything at once | Commit one logical change at a time |
| Working on `main` locally | Always `git checkout -b <branch>` before coding |
| Force-pushing to `main` | Never. Only force-push to your own feature branch |
| Merging your own PR without review | Wait for at least one review unless you are the sole owner |

---

Happy contributing! 🚀

---

## CodeRoom Project Overview (Hack-Sprint)

This repository contains the complete implementation of **CodeRoom** — a real-time collaborative code editor with MongoDB persistence, real-time presence indicators, host controls, and custom delta-based sync engine.

### Team Roles & Domain Splits
- **Domain A (Auth & Room Management):** Room CRUD, shareable room codes, join-by-code validation, session reconnect logic, and cookie-based host privileges.
- **Domain B (Document & Sync Engine):** Monospace shared text editor, delta-based edits (computes insertions/deletions on changes), and custom **Position-Shift Transform (OT-lite)** conflict resolution strategy.
- **Domain C (Realtime & Presence):** Socket.io rooms, typing indicators, active editor updates, and cursor positions.
- **MongoDB Persistence:** Managed jointly, persisting room status and document versions to MongoDB Atlas.

### Conflict-Resolution Strategy (Domain B)
For our collaborative editing sync engine, we chose a custom **Position-Shift Transform (OT-lite)** strategy instead of any banned CRDT/OT libraries:
1. Every keystroke is converted into a **delta** operation: `{ type: "insert"|"delete", position: number, text: string, version: number }`.
2. The server keeps an authoritative monotonically increasing version counter and a recent operation log.
3. When a delta from a client arrives, the server checks if the client's version is stale.
4. If stale, it **transforms** the delta's target position by shifting it left or right based on all intermediate operations the client missed (e.g., shifting right by the length of other participants' insertions).
5. The server applies the transformed delta, updates MongoDB, and broadcasts the transformed delta to all other room members, keeping cursor positions aligned without overwrites.

### Quick Start Guide

#### 1. Setup Backend (.env)
Go to the `server/` directory and configure the environment variables:
```bash
cd server
cp .env.example .env
```
Fill in the `MONGO_URI` with your MongoDB connection string (e.g., MongoDB Atlas).

#### 2. Start Backend Server
```bash
npm install
npm run dev
```
By default, the backend runs on `http://localhost:3000`.

#### 3. Start Frontend Client
In a new terminal window, navigate to the `client/` directory:
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. Open multiple windows/tabs to test the real-time synchronization, cursor positioning, typing indicators, and host actions!

