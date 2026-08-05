"use client"

import { useState } from "react"
import type { Task } from "../../lib/pawpal"
import { explainPlan, generatePlan, sortByTime, warnConflicts } from "../../lib/pawpal"
import { usePawpalStore } from "../../lib/pawpal-store"
import AppNav from "../components1/AppNav"

export default function SchedulePage() {
  const { owner, pets, activePet, activePetIndex, setActivePetIndex, setAvailableMinutes } = usePawpalStore()
  const [scheduledTasks, setScheduledTasks] = useState<Task[]>([])
  const [scheduleReasons, setScheduleReasons] = useState<string[]>([])
  const [conflictMessage, setConflictMessage] = useState<string>("")
  const [statusMessage, setStatusMessage] = useState<string>("")

  function generateSchedule() {
    const plan = generatePlan(owner, activePet)
    setScheduledTasks(plan)
    setScheduleReasons(explainPlan(plan))
    setConflictMessage(warnConflicts(activePet.tasks || []))
    setStatusMessage(plan.length ? `Generated schedule with ${plan.length} task(s).` : "No tasks fit within available time.")
  }

  return (
    <main>
      <AppNav />
      <div className="pawpal-main">
        <aside className="sidebar">
          <h2>Schedule Setup</h2>
          <label>Owner</label>
          <input className="input" value={owner.name} readOnly />

          <label>Available minutes</label>
          <input
            className="input"
            type="number"
            min={0}
            value={owner.available_time_minutes}
            onChange={(event) => setAvailableMinutes(Number(event.target.value))}
          />

          <label>Active pet</label>
          <select className="input" value={activePetIndex} onChange={(event) => setActivePetIndex(Number(event.target.value))}>
            {pets.map((pet, index) => (
              <option key={`${pet.name}-${index}`} value={index}>
                {pet.name}
              </option>
            ))}
          </select>

          <button className="btn primary" style={{ marginTop: 12 }} onClick={generateSchedule}>Generate schedule</button>
        </aside>

        <section className="content">
          <h2>Daily Plan for {activePet.name}</h2>
          {statusMessage && <p className="status-message">{statusMessage}</p>}

          <h3>Tasks ordered by preferred time</h3>
          {scheduledTasks.length ? (
            <div>
              {sortByTime(scheduledTasks).map((task, index) => (
                <div key={`${task.title}-${index}`} className="task-card" style={{ marginBottom: 10 }}>
                  {task.title} - {task.preferred_time || "N/A"} - {task.duration_minutes}m
                </div>
              ))}
            </div>
          ) : (
            <p>Generate a schedule to view ordered tasks.</p>
          )}

          <h3>Scheduled tasks</h3>
          {scheduledTasks.length ? (
            <div>
              {scheduledTasks.map((task, index) => (
                <div key={`${task.title}-scheduled-${index}`} className="task-card" style={{ marginBottom: 10 }}>
                  {task.title} - {task.duration_minutes}m - {task.priority}
                </div>
              ))}
            </div>
          ) : (
            <p>No scheduled tasks yet.</p>
          )}

          <h3>Why this plan</h3>
          {scheduleReasons.length ? (
            <ul>
              {scheduleReasons.map((reason, index) => (
                <li key={`reason-${index}`}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p>Generate a plan to see reasoning.</p>
          )}

          <h3>Conflicts</h3>
          <p>{conflictMessage || "Generate a plan to check conflicts."}</p>
        </section>
      </div>
    </main>
  )
}
