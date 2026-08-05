# Ticket CRUD verification

## Automated backend test

From `final-project`, run:

```powershell
php backend\artisan test --filter=TicketCrudTest
```

The test covers:

- An employee can create, read, update, and delete their own ticket.
- An employee cannot read, update, or delete another employee's ticket.
- A technician cannot use employee CRUD endpoints.
- An unauthenticated request cannot use ticket endpoints.

## Frontend checks

Start MySQL in XAMPP, then keep these commands running in separate terminals:

```powershell
php backend\artisan serve
npm run dev --prefix frontend
```

Log in as an employee and verify:

1. Create a ticket using a category and priority.
2. Open the ticket and confirm its saved details.
3. Edit its subject, description, category, or priority.
4. Delete it and accept the confirmation dialog.
5. Confirm it disappears from the list and the total decreases.

## Build checks

```powershell
npm run build --prefix frontend
npm run lint --prefix frontend
php backend\artisan route:list --path=tickets
```

The employee CRUD routes are protected by both `auth:api` and
`role:employee`. The controller also limits read, update, and delete operations
to tickets created by the authenticated employee.
