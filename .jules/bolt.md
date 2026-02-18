## 2024-05-22 - Tracked Build Artifacts
**Learning:** The `.next` directory is surprisingly tracked in git. Running `npm run build` or `npm run dev` modifies these tracked files, polluting the git status and risking large binary commits.
**Action:** Always check `git status` for `.next` changes and discard them (e.g., `git checkout HEAD .next`) before submitting code changes.
