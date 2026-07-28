# IT Help Desk System - Phase 1 Deliverables

This package contains the corrected analysis and design deliverables for the IT Help Desk System.

## Selected technology stack

| Category | Selection |
|---|---|
| Frontend | React (JavaScript), HTML5, CSS3 |
| Backend | PHP Laravel |
| Database | MySQL 9.7 |
| Database management | DBeaver |
| Code editor | Visual Studio Code |
| API testing | Postman |
| Diagrams | Draw.io |
| Version control | Git and GitHub |
| Repository | https://github.com/bashirsaad99/IT-Helpdesk-System |

## Included deliverables

- `Documentation/Requirements/`: project scope and role requirements.
- `Documentation/Workflows/`: corrected ticket-management workflow with the unresolved-ticket loop.
- `Documentation/Wireframes/`: six redesigned UI wireframes plus one combined PDF.
- `Documentation/Database/schema.sql`: complete MySQL schema for all seven entities.
- `Documentation/Database/IT_Helpdesk_ERD.drawio`: clean ERD matching the SQL schema.
- `Documentation/Architecture/IT_Helpdesk_Architecture.drawio`: React/Laravel/MySQL architecture.

## Database setup

1. Open DBeaver and connect to MySQL at `localhost:3306`.
2. Open `Documentation/Database/schema.sql`.
3. Execute the whole script.
4. Refresh the connection and confirm these tables exist:
   `roles`, `departments`, `users`, `categories`, `tickets`, `comments`, and `attachments`.

The SQL script is safe to run on a server where `it_helpdesk` does not already contain tables with these names.
