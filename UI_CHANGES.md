# PawPal UI Changes Log

This file records UI/UX edits made to the PawPal Streamlit app by the assistant.

## Change entries

- 2026-08-04: Updated `app.py` to a new interactive UI.
  - Features added:
    - Multiple pets management in the sidebar (add/delete/select active pet).
    - Owner settings saved from sidebar (name and available time).
    - Task CRUD: add tasks, edit task fields (title, duration, priority, preferred time), delete tasks.
    - Mark tasks complete, with recurring-task auto-creation using existing `Task.mark_complete()` logic.
    - Schedule generation and display using `Scheduler` logic from `pawpal_system.py`.
    - In-session changelog (`st.session_state.changelog_ui`) that captures UI edits (add/edit/delete actions) for the session.
  - Files modified: `app.py` (updated).

No files were deleted. No dependencies were changed.

You can view the interactive changelog inside the Streamlit app under "Changelog (UI edits)" during the session.
