from typing import Optional
import streamlit as st
from pawpal_system import Owner, Pet, Scheduler, Task

st.set_page_config(page_title="PawPal+", page_icon="🐾", layout="centered")


st.set_page_config(page_title="PawPal+", page_icon="🐾", layout="wide")

st.title("🐾 PawPal+")

st.markdown(
    """
Welcome to PawPal+. Manage owners, multiple pets, and pet-care tasks.

This UI provides task CRUD (create/read/update/delete), marking complete,
recurrence handling, and schedule generation using the `pawpal_system` logic.
"""
)


# Initialize session state objects
if "owner" not in st.session_state:
    st.session_state.owner = Owner(name="Jordan", available_time_minutes=180)
if "active_pet_index" not in st.session_state:
    # Index into owner.pets; start with a default pet if none exist
    if not st.session_state.owner.pets:
        default_pet = Pet(name="Mochi", species="dog")
        st.session_state.owner.add_pet(default_pet)
    st.session_state.active_pet_index = 0
if "changelog_ui" not in st.session_state:
    st.session_state.changelog_ui = []


def active_pet() -> Pet:
    owner: Owner = st.session_state.owner
    idx = min(max(0, st.session_state.active_pet_index), len(owner.pets) - 1)
    return owner.pets[idx]


def log_change(entry: str) -> None:
    st.session_state.changelog_ui.append(entry)


owner: Owner = st.session_state.owner
pet: Pet = active_pet()


# Sidebar: Owner and Pets management
with st.sidebar:
    st.header("Owner & Pets")
    owner_name = st.text_input("Owner name", value=owner.name)
    owner_time = st.number_input(
        "Available time (minutes)", min_value=0, max_value=1440, value=owner.available_time_minutes
    )

    if st.button("Save owner"):
        old = f"Owner name: {owner.name}, time: {owner.available_time_minutes}"
        owner.name = owner_name
        owner.update_available_time(int(owner_time))
        st.session_state.owner = owner
        log_change(
            f"Updated owner: {old} -> {owner.name}, {owner.available_time_minutes} mins")
        st.success("Owner updated")

    st.markdown("---")
    st.subheader("Pets")
    pet_names = [p.name for p in owner.pets]
    selected = st.selectbox("Active pet", options=pet_names,
                            index=st.session_state.active_pet_index)
    st.session_state.active_pet_index = pet_names.index(selected)

    st.markdown("Add new pet")
    new_pet_name = st.text_input("Pet name", key="new_pet_name")
    new_pet_species = st.selectbox(
        "Species", ["dog", "cat", "other"], key="new_pet_species")
    if st.button("Add pet"):
        new_pet = Pet(name=new_pet_name or "New Pet", species=new_pet_species)
        owner.add_pet(new_pet)
        st.session_state.owner = owner
        log_change(f"Added pet: {new_pet.name} ({new_pet.species})")
        st.success(f"Added pet {new_pet.name}")

    if st.button("Delete active pet"):
        removed = owner.pets.pop(st.session_state.active_pet_index)
        log_change(f"Deleted pet: {removed.name}")
        st.session_state.active_pet_index = max(
            0, st.session_state.active_pet_index - 1)
        st.session_state.owner = owner
        st.success(f"Deleted pet {removed.name}")


# Main area: Tasks and schedule
st.subheader(f"Active pet: {pet.name} ({pet.species})")

with st.expander("Add a task", expanded=True):
    with st.form("add_task_form"):
        title = st.text_input("Task title", value="Morning walk")
        duration = st.number_input(
            "Duration (minutes)", min_value=1, max_value=480, value=20)
        priority = st.selectbox("Priority", ["low", "medium", "high"], index=1)
        preferred_time = st.text_input("Preferred time (HH:MM)", value="09:00")
        is_recurring = st.checkbox("Is recurring", value=False)
        recurrence = None
        if is_recurring:
            recurrence = st.selectbox(
                "Recurrence", ["daily", "weekly"], index=0)

        add_submitted = st.form_submit_button("Add task")
        if add_submitted:
            task = Task(
                title=title,
                duration_minutes=int(duration),
                priority=priority,
                preferred_time=preferred_time or None,
                is_recurring=is_recurring,
                recurrence=recurrence,
            )
            pet.add_task(task)
            st.session_state.owner = owner
            log_change(f"Added task '{task.title}' to pet {pet.name}")
            st.success(f"Added {task.title}")


st.markdown("---")

st.subheader("Tasks")
if not pet.tasks:
    st.info("No tasks yet for this pet. Add one above.")
else:
    for i, task in enumerate(list(pet.tasks)):
        cols = st.columns([0.6, 0.18, 0.12, 0.1])
        with cols[0]:
            with st.expander(f"{task.title} — {task.priority} — {task.duration_minutes}m", expanded=False):
                st.write(f"Preferred time: {task.preferred_time}")
                st.write(
                    f"Recurring: {task.is_recurring} {task.recurrence or ''}")
                st.write(f"Complete: {task.is_complete}")
                # Edit form
                with st.form(f"edit_task_{i}"):
                    t_title = st.text_input("Title", value=task.title)
                    t_duration = st.number_input(
                        "Duration", min_value=1, value=task.duration_minutes, key=f"dur_{i}")
                    t_priority = st.selectbox("Priority", ["low", "medium", "high"], index=[
                                              "low", "medium", "high"].index(task.priority), key=f"prio_{i}")
                    t_preferred = st.text_input(
                        "Preferred time", value=task.preferred_time or "", key=f"pref_{i}")
                    save = st.form_submit_button("Save changes")
                    if save:
                        old = (task.title, task.duration_minutes,
                               task.priority, task.preferred_time)
                        task.title = t_title
                        task.duration_minutes = int(t_duration)
                        task.priority = t_priority
                        task.preferred_time = t_preferred or None
                        st.session_state.owner = owner
                        log_change(
                            f"Edited task {old} -> ({task.title}, {task.duration_minutes}, {task.priority}, {task.preferred_time}) for pet {pet.name}")
                        st.success("Task updated")

        with cols[1]:
            if st.button("Mark complete", key=f"complete_{i}"):
                next_task = task.mark_complete()
                st.session_state.owner = owner
                log_change(f"Marked complete: {task.title} for pet {pet.name}")
                if next_task:
                    log_change(
                        f"Auto-created recurring task: {next_task.title} due {next_task.due_date}")
                st.experimental_rerun()

        with cols[2]:
            if st.button("Delete", key=f"delete_{i}"):
                pet.remove_task(task.title)
                st.session_state.owner = owner
                log_change(f"Deleted task '{task.title}' from pet {pet.name}")
                st.experimental_rerun()

        with cols[3]:
            st.write("")


st.markdown("---")
st.subheader("Generate schedule")
if st.button("Generate schedule"):
    plan = Scheduler(owner=owner, pet=pet)
    for t in pet.tasks:
        plan.add_task(t)
    conflict_message = plan.warn_conflicts()
    if conflict_message != "No scheduling conflicts detected.":
        st.warning(conflict_message)
    else:
        st.success(conflict_message)

    plan.sort_by_time()
    st.subheader("Tasks ordered by preferred time")
    st.table([
        {"title": t.title, "preferred_time": t.preferred_time,
            "duration_minutes": t.duration_minutes, "priority": t.priority}
        for t in plan.tasks
    ])

    scheduled_tasks = plan.generate_plan()
    st.subheader("Scheduled tasks")
    if scheduled_tasks:
        st.table([
            {"title": t.title, "duration_minutes": t.duration_minutes, "priority": t.priority} for t in scheduled_tasks
        ])
        st.subheader("Why this plan")
        for reason in plan.explain_plan():
            st.write(f"- {reason}")
    else:
        st.info("No tasks fit within the available time.")


st.markdown("---")
st.subheader("Changelog (UI edits)")
if st.session_state.changelog_ui:
    for entry in st.session_state.changelog_ui:
        st.write(f"- {entry}")
else:
    st.write("No UI changes recorded this session.")
