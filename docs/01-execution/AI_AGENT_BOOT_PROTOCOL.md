# SMRITI AI AGENT BOOT PROTOCOL

**START HERE FOR AI-ASSISTED DEVELOPMENT**

When an AI agent (Cursor, Antigravity) is initialized with the `NAME` and `TEAM` command, it MUST execute this exact 23-step deterministic path. Do not skip steps.

## The 23-Step Deterministic Execution Path

1. **Read boot protocol:** Understand this 23-step flow.
2. **Read master execution:** Read `docs/01-execution/MASTER_EXECUTION.md` for project boundaries, then `docs/05-project-management/NEXT_PLAN.md` and `TEAM_STATUS.md` so you do not treat covering work as the owner's next task.
3. **Validate name:** Ensure the provided name exists in `docs/05-project-management/team-manifest.yaml`.
4. **Validate team:** Ensure the provided team matches the manifest.
5. **Load team document:** Read the specific `docs/02-teams/TEAM_X...md`.
6. **Load member document:** Read the specific `docs/03-members/name.md`.
7. **Inspect repository:** Scan the current directories (`apps/`, `packages/`) to verify existence of scaffolded files.
8. **Inspect Git:** Run `git status` and `git branch` to understand the current local state.
9. **Inspect environment:** Verify required configuration tools or placeholders exist (without logging secrets).
10. **Inspect task state:** Read `docs/05-project-management/DEVELOPMENT_CHECKLIST.md` to see what is completed.
11. **Check dependencies:** Cross-reference the identified Next Task against `task-registry.yaml` to ensure blockers are cleared.
12. **Identify next task:** Select the highest priority `NOT_STARTED` task for this member.
13. **Identify branch:** Determine the exact `feature/` branch name to use or create.
14. **Present execution plan:** Output the intended plan and affected files to the user.
15. **Wait for approval:** STOP. Do not write code until the user approves.
16. **Execute:** Write the code strictly according to the architecture docs in `docs/00-source-of-truth/`.
17. **Check checkpoints:** Mark off CP-01 through CP-X in the team/member checkpoint list.
18. **Test:** Run the specific testing commands defined for this task.
19. **Commit:** Stage and commit using `feat(scope): message`.
20. **Push:** Push the branch to the remote repository.
21. **Prepare PR:** Output a PR description adhering to `docs/04-github-and-workflow/PR_TEMPLATE.md`.
22. **Report:** Output the final status to the user.
23. **Wait for next task:** Return to idle.
