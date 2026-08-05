"use client"

import { useState } from "react"
import type { Task } from "../../lib/pawpal"
import AppNav from "../components1/AppNav"
import { usePawpalStore } from "../../lib/pawpal-store"

type TaskDraft = {
  title: string
  duration_minutes: number
  priority: "low" | "medium" | "high"
  category: string
  preferred_time: string
  due_date: string
  is_recurring: boolean
  recurrence: "daily" | "weekly"
}

const defaultTaskDraft: TaskDraft = {
  title: "",
  duration_minutes: 20,
  priority: "medium",
  category: "general",
  preferred_time: "",
  due_date: "",
  is_recurring: false,
  recurrence: "daily",
}

export default function PetsPage() {
  const {
    owner,
    pets,
    activePet,
    activePetIndex,
    setOwnerName,
    setAvailableMinutes,
    setActivePetIndex,
    addPet,
    removeActivePet,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
  } = usePawpalStore()

  const [newPetName, setNewPetName] = useState("")
  const [newPetSpecies, setNewPetSpecies] = useState("dog")
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(defaultTaskDraft)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [statusMessage, setStatusMessage] = useState("")

  function addPetAction() {
    const name = newPetName.trim() || "New Pet"
    addPet(name, newPetSpecies)
    setNewPetName("")
    setNewPetSpecies("dog")
    setStatusMessage(`Added pet ${name}.`)
  }

  function removePetAction() {
    const result = removeActivePet()
    if (!result.removed) {
      setStatusMessage("At least one pet is required.")
      return
    }
    setStatusMessage(`Removed ${result.removedName || "pet"}.`)
  }

  function addTaskAction() {
    if (!taskDraft.title.trim()) {
      setStatusMessage("Task title is required.")
      return
    }
    addTask({
      title: taskDraft.title,
      duration_minutes: taskDraft.duration_minutes,
      priority: taskDraft.priority,
      category: taskDraft.category,
      preferred_time: taskDraft.preferred_time,
      due_date: taskDraft.due_date,
      is_recurring: taskDraft.is_recurring,
      recurrence: taskDraft.is_recurring ? taskDraft.recurrence : null,
      is_complete: false,
    })
    setTaskDraft(defaultTaskDraft)
    setStatusMessage("Task added.")
  }

  function startEditTask(index: number) {
    const selected = activePet.tasks?.[index]
    if (!selected) return
    setEditIndex(index)
    setEditTask({ ...selected })
  }

  function saveEditTask() {
    if (editIndex === null || !editTask) return
    updateTask(editIndex, editTask)
    setEditIndex(null)
    setEditTask(null)
    setStatusMessage("Task updated.")
  }

  function deleteTaskAction(index: number) {
    deleteTask(index)
    if (editIndex === index) {
      setEditIndex(null)
      setEditTask(null)
    }
    setStatusMessage("Task deleted.")
  }

  function completeTaskAction(index: number) {
    const result = completeTask(index)
    setStatusMessage(result.createdNext ? "Task completed and recurring follow-up created." : "Task completed.")
  }

  return (
    <main>
      <AppNav />
      <div className="pawpal-main">
        <aside className="sidebar">
          <h2>Owner & Pets</h2>
          <label>Owner name</label>
          <input className="input" value={owner.name} onChange={(event) => setOwnerName(event.target.value)} />

          <label>Available minutes</label>
          <input
            className="input"
            type="number"
            min={0}
            value={owner.available_time_minutes}
            onChange={(event) => setAvailableMinutes(Number(event.target.value))}
          />

          <hr />
          <h3>Pets</h3>
          <select className="input" value={activePetIndex} onChange={(event) => setActivePetIndex(Number(event.target.value))}>
            {pets.map((pet, index) => (
              <option key={`${pet.name}-${index}`} value={index}>
                {pet.name}
              </option>
            ))}
          </select>

          <div className="pet-form">
            <h4>Add pet</h4>
            <input className="input" placeholder="Pet name" value={newPetName} onChange={(event) => setNewPetName(event.target.value)} />
            <select className="input" value={newPetSpecies} onChange={(event) => setNewPetSpecies(event.target.value)}>
              <option value="dog">dog</option>
              <option value="cat">cat</option>
              <option value="other">other</option>
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn primary" onClick={addPetAction}>Add Pet</button>
              <button className="btn danger" onClick={removePetAction}>Remove Active</button>
            </div>
          </div>
        </aside>

        <section className="content">
          <h2>Active pet: {activePet.name} ({activePet.species})</h2>
          {statusMessage && <p className="status-message">{statusMessage}</p>}

          <div className="task-form">
            <h4>Add Task</h4>
            <input className="input" placeholder="Title" value={taskDraft.title} onChange={(event) => setTaskDraft((draft) => ({ ...draft, title: event.target.value }))} />
            <input
              className="input"
              type="number"
              min={1}
              value={taskDraft.duration_minutes}
              onChange={(event) => setTaskDraft((draft) => ({ ...draft, duration_minutes: Number(event.target.value) }))}
            />
            <select className="input" value={taskDraft.priority} onChange={(event) => setTaskDraft((draft) => ({ ...draft, priority: event.target.value as "low" | "medium" | "high" }))}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <input className="input" placeholder="Category" value={taskDraft.category} onChange={(event) => setTaskDraft((draft) => ({ ...draft, category: event.target.value }))} />
            <input className="input" placeholder="Preferred time (HH:MM)" value={taskDraft.preferred_time} onChange={(event) => setTaskDraft((draft) => ({ ...draft, preferred_time: event.target.value }))} />
            <input className="input" type="date" value={taskDraft.due_date} onChange={(event) => setTaskDraft((draft) => ({ ...draft, due_date: event.target.value }))} />

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={taskDraft.is_recurring} onChange={(event) => setTaskDraft((draft) => ({ ...draft, is_recurring: event.target.checked }))} />
              Recurring task
            </label>

            {taskDraft.is_recurring && (
              <select className="input" value={taskDraft.recurrence} onChange={(event) => setTaskDraft((draft) => ({ ...draft, recurrence: event.target.value as "daily" | "weekly" }))}>
                <option value="daily">daily</option>
                <option value="weekly">weekly</option>
              </select>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn primary" onClick={addTaskAction}>Add task</button>
              <button className="btn ghost" onClick={() => setTaskDraft(defaultTaskDraft)}>Clear</button>
            </div>
          </div>

          <hr />
          <h3>Tasks</h3>
          {activePet.tasks && activePet.tasks.length ? (
            activePet.tasks.map((task, index) => (
              <div key={`${task.title}-${index}`} className="task-card" style={{ marginBottom: 10 }}>
                {editIndex === index && editTask ? (
                  <div>
                    <div>
                      <label>Title</label>
                      <input value={editTask.title} onChange={(event) => setEditTask({ ...editTask, title: event.target.value })} />
                    </div>
                    <div>
                      <label>Duration</label>
                      <input type="number" value={editTask.duration_minutes} onChange={(event) => setEditTask({ ...editTask, duration_minutes: Number(event.target.value) })} />
                    </div>
                    <div>
                      <label>Priority</label>
                      <select value={editTask.priority || "medium"} onChange={(event) => setEditTask({ ...editTask, priority: event.target.value as "low" | "medium" | "high" })}>
                        <option value="low">low</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                      </select>
                    </div>
                    <div>
                      <label>Preferred time</label>
                      <input value={editTask.preferred_time || ""} onChange={(event) => setEditTask({ ...editTask, preferred_time: event.target.value })} placeholder="HH:MM" />
                    </div>
                    <div>
                      <label>Category</label>
                      <input value={editTask.category || "general"} onChange={(event) => setEditTask({ ...editTask, category: event.target.value })} />
                    </div>
                    <div>
                      <label>Due date</label>
                      <input type="date" value={editTask.due_date || ""} onChange={(event) => setEditTask({ ...editTask, due_date: event.target.value })} />
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(editTask.is_recurring)}
                        onChange={(event) => setEditTask({ ...editTask, is_recurring: event.target.checked, recurrence: event.target.checked ? editTask.recurrence || "daily" : null })}
                      />
                      Recurring task
                    </label>
                    {editTask.is_recurring && (
                      <div>
                        <label>Recurrence</label>
                        <select value={editTask.recurrence || "daily"} onChange={(event) => setEditTask({ ...editTask, recurrence: event.target.value as "daily" | "weekly" })}>
                          <option value="daily">daily</option>
                          <option value="weekly">weekly</option>
                        </select>
                      </div>
                    )}
                    <div className="task-actions">
                      <button className="btn primary" onClick={saveEditTask}>Save</button>
                      <button className="btn ghost" onClick={() => { setEditIndex(null); setEditTask(null) }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>{task.title}{task.is_complete ? " (complete)" : ""}</strong>
                        <div style={{ color: "#64748b", fontSize: 13 }}>
                          {task.priority} • {task.duration_minutes}m
                          {task.preferred_time ? ` • ${task.preferred_time}` : ""}
                          {task.due_date ? ` • due ${task.due_date}` : ""}
                          {task.is_recurring ? ` • recurring ${task.recurrence || "daily"}` : ""}
                        </div>
                      </div>
                      <div className="task-actions">
                        {!task.is_complete && <button className="btn primary" onClick={() => completeTaskAction(index)}>Complete</button>}
                        <button className="btn ghost" onClick={() => startEditTask(index)}>Edit</button>
                        <button className="btn danger" onClick={() => deleteTaskAction(index)}>Delete</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No tasks yet.</p>
          )}
        </section>
      </div>
    </main>
  )
}
