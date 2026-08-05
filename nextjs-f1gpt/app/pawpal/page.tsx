"use client"

import { useState } from "react"
import type { Owner, Pet, Task } from "../../lib/pawpal"

const defaultOwner: Owner = { name: "Jordan", available_time_minutes: 180, preferences: [], pets: [{ name: "Mochi", species: "dog", tasks: [] }] }

export default function PawpalPage() {
  const [owner, setOwner] = useState<Owner>(defaultOwner)
  const [activePetIndex, setActivePetIndex] = useState(0)
  const [inputTaskTitle, setInputTaskTitle] = useState("")
  const [inputTaskDuration, setInputTaskDuration] = useState(20)
  const [showChat, setShowChat] = useState(false)
  const [ragQuery, setRagQuery] = useState("")
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const pet = owner.pets[activePetIndex]

  function addPet(name: string, species: string) {
    const p: Pet = { name, species, tasks: [] }
    setOwner((o) => ({ ...o, pets: [...(o.pets || []), p] }))
    setActivePetIndex((i) => Math.max(0, (owner.pets || []).length))
  }

  function addTask() {
    if (!inputTaskTitle) return
    const t: Task = { title: inputTaskTitle, duration_minutes: inputTaskDuration, priority: "medium" }
    const newPets = owner.pets!.map((p, idx) => idx === activePetIndex ? { ...p, tasks: [...(p.tasks || []), t] } : p)
    setOwner({ ...owner, pets: newPets })
    setInputTaskTitle("")
    setInputTaskDuration(20)
  }

  async function askPawpal() {
    if (!ragQuery.trim()) return
    setIsLoading(true)
    try {
      const resp = await fetch("/api/pawpal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: ragQuery, owner, pet }),
      })
      const data = await resp.json()
      setChatHistory((h) => [{ question: ragQuery, answer: data.text, facts: data.facts }, ...h])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main style={{ display: "flex", gap: 20, padding: 24 }}>
      <aside style={{ width: 320 }}>
        <h2>Owner & Pets</h2>
        <label>Owner name</label>
        <input value={owner.name} onChange={(e) => setOwner({ ...owner, name: e.target.value })} />
        <label>Available minutes</label>
        <input type="number" value={owner.available_time_minutes} onChange={(e) => setOwner({ ...owner, available_time_minutes: Number(e.target.value) })} />

        <hr />
        <h3>Pets</h3>
        <select value={activePetIndex} onChange={(e) => setActivePetIndex(Number(e.target.value))}>
          {owner.pets!.map((p, i) => (
            <option key={i} value={i}>{p.name}</option>
          ))}
        </select>
        <div>
          <h4>Add pet</h4>
          <button onClick={() => addPet("New Pet", "dog")}>Add Pet</button>
        </div>
      </aside>

      <section style={{ flex: 1 }}>
        <h2>Active pet: {pet.name} ({pet.species})</h2>

        <div>
          <h4>Add Task</h4>
          <input placeholder="Title" value={inputTaskTitle} onChange={(e) => setInputTaskTitle(e.target.value)} />
          <input type="number" value={inputTaskDuration} onChange={(e) => setInputTaskDuration(Number(e.target.value))} />
          <button onClick={addTask}>Add task</button>
        </div>

        <hr />
        <h3>Tasks</h3>
        {pet.tasks && pet.tasks.length ? (
          pet.tasks.map((t, i) => (
            <div key={i} style={{ border: "1px solid #ddd", padding: 8, marginBottom: 6 }}>
              <strong>{t.title}</strong> — {t.priority} — {t.duration_minutes}m
            </div>
          ))
        ) : (
          <p>No tasks yet.</p>
        )}

        <hr />
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setShowChat((s) => !s)}>Toggle chat</button>
          <button onClick={async () => { /* placeholder for schedule generation */ alert('Generate schedule in next step') }}>Generate schedule</button>
        </div>

        {showChat && (
          <div style={{ marginTop: 16 }}>
            <h3>PawPal Assistant</h3>
            <textarea value={ragQuery} onChange={(e) => setRagQuery(e.target.value)} rows={3} style={{ width: "100%" }} />
            <div>
              <button onClick={askPawpal} disabled={isLoading}>{isLoading ? "Asking..." : "Ask PawPal"}</button>
            </div>

            {chatHistory.map((entry, idx) => (
              <details key={idx} style={{ marginTop: 8 }}>
                <summary>Question: {entry.question}</summary>
                <p>{entry.answer}</p>
                {entry.facts && (
                  <div>
                    <strong>Retrieved facts:</strong>
                    <ul>{entry.facts.map((f: string, i: number) => <li key={i}>{f}</li>)}</ul>
                  </div>
                )}
              </details>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
