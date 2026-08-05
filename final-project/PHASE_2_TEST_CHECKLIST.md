# Phase 2 verification

Run from `final-project/backend`:

```powershell
php artisan migrate
php artisan test
```

Run from `final-project/frontend`:

```powershell
npm install
npm run build
```

Manual browser test:

1. As admin, assign an open ticket to a technician; confirm it becomes Assigned.
2. Confirm an employee/admin account cannot be selected as the assignee.
3. As the assigned technician, change Assigned to In Progress, then Resolved, then Closed.
4. Confirm skipping directly from Assigned to Resolved or Closed is rejected.
5. Add a public reply and an internal note as technician/admin.
6. As the employee, confirm the public reply is visible and the internal note is hidden.
7. Confirm the timeline shows creation, assignment, status, priority, replies, and notes to authorized roles.
