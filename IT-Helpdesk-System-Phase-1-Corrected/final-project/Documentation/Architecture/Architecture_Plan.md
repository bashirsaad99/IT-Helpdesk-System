# Application Architecture Plan

## Overview

The IT Help Desk System uses a separated web architecture:

1. A React frontend presents role-specific pages in the browser.
2. The frontend exchanges JSON data with a Laravel REST API over HTTPS.
3. Laravel applies authentication, authorization, validation, and ticket business rules.
4. Laravel reads and writes the MySQL database.
5. Uploaded attachments are stored outside the public web root; only their validated paths are saved in MySQL.

## Main layers

| Layer | Technology | Responsibility |
|---|---|---|
| Presentation | React, JavaScript, HTML5, CSS3 | Screens, forms, navigation, dashboards, and client-side validation |
| API and business logic | PHP Laravel | Authentication, role checks, validation, ticket workflow, assignments, comments, and reports |
| Data access | Laravel Eloquent ORM | Database queries and entity relationships |
| Database | MySQL 9.7 | Persistent users, tickets, comments, categories, departments, roles, and attachment metadata |
| File storage | Laravel storage | Protected ticket attachments |

## Recommended Laravel API groups

- `/api/auth`: login, logout, and current user.
- `/api/tickets`: create, list, view, update, assign, resolve, and close tickets.
- `/api/tickets/{id}/comments`: ticket conversation.
- `/api/tickets/{id}/attachments`: upload and download attachments.
- `/api/users`, `/api/roles`, `/api/departments`, `/api/categories`: administration.
- `/api/reports`: administrator dashboard summaries.

## Security decisions

- Hash passwords with Laravel's password hashing service.
- Protect API routes using Laravel Sanctum.
- Enforce role permissions in policies or middleware.
- Validate file type and size before storage.
- Do not store uploads in a directly executable public directory.
- Use HTTPS and environment variables for credentials in deployment.
