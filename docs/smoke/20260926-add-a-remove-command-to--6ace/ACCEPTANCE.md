# Acceptance — epic 20260926-add-a-remove-command-to--6ace

- A1 (observable_by_user): WHEN the user runs `todo remove <id>` and an item with that id exists THE SYSTEM SHALL print `removed <id>` on stdout and exit with status 0.
- A2 (observable_by_user): WHEN the user runs `todo list` after a successful `todo remove <id>` THE SYSTEM SHALL show no line for that id while every other item still appears exactly as before.
- A3 (observable_by_user): WHEN the user runs `todo remove <id>` and no item with that id exists THE SYSTEM SHALL print `no item <id>` and exit with a non-zero status.
- A4 (observable_by_user): WHEN `todo remove <id>` fails with `no item <id>` THE SYSTEM SHALL leave the output of `todo list` identical to what it was before the attempt.
- A5 (observable_by_user): WHEN the user runs `todo remove <id>` for an item already marked done THE SYSTEM SHALL remove it the same way as an open item (prints `removed <id>`, item gone from `todo list`).
- A6 (observable_by_user): WHEN the user runs `todo add`, `todo done` or `todo list` after a `todo remove` THE SYSTEM SHALL keep working on the saved file exactly as before (existing commands and the todo.json shape are unaffected).
- A7 (observable_by_user): WHEN the user runs `todo` with an unknown command THE SYSTEM SHALL print a usage line that mentions `todo remove <id>`.
- A8 (internal): WHEN `cd examples/demo && npm test` runs THE SYSTEM SHALL pass, including a test that removes a known id and one that rejects an unknown id with `no item <id>`.
