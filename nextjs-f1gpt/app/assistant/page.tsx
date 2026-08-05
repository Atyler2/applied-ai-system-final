"use client"

import { useState } from "react"
import AppNav from "../components1/AppNav"
import { usePawpalStore } from "../../lib/pawpal-store"

type ChatEntry = {
  question: string
  answer: string
  facts?: string[]
  warning?: string | null
}

export default function AssistantPage() {
  const { owner, pets, activePet, activePetIndex, setActivePetIndex } = usePawpalStore()
  const [ragQuery, setRagQuery] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  async function askPawpal() {
    if (!ragQuery.trim()) return

    setIsLoading(true)
    setStatusMessage("")

    try {
      const response = await fetch("/api/pawpal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: ragQuery, owner, pet: activePet }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStatusMessage(data?.error || "Assistant request failed.")
        return
      }

      setChatHistory((history) => [
        {
          question: ragQuery,
          answer: data?.text || "No response.",
          facts: Array.isArray(data?.facts) ? data.facts : [],
          warning: data?.warning || null,
        },
        ...history,
      ])

      setRagQuery("")
      setStatusMessage(data?.warning ? "Response returned with fallback mode." : "Response generated.")
    } catch {
      setStatusMessage("Assistant request failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main>
      <AppNav />
      <div className="pawpal-main">
        <aside className="sidebar">
          <h2>Assistant Context</h2>
          <label>Owner</label>
          <input className="input" readOnly value={owner.name} />

          <label>Active pet</label>
          <select className="input" value={activePetIndex} onChange={(event) => setActivePetIndex(Number(event.target.value))}>
            {pets.map((pet, index) => (
              <option key={`${pet.name}-${index}`} value={index}>
                {pet.name}
              </option>
            ))}
          </select>

          <p style={{ color: "#64748b", fontSize: 13 }}>Task context is automatically sent from your active pet and owner profile.</p>
        </aside>

        <section className="content">
          <h2>Ask PawPal about {activePet.name}</h2>
          {statusMessage && <p className="status-message">{statusMessage}</p>}

          <textarea
            rows={4}
            style={{ width: "100%" }}
            value={ragQuery}
            onChange={(event) => setRagQuery(event.target.value)}
            placeholder="Ask about schedule, care priorities, or next best action."
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn primary" onClick={askPawpal} disabled={isLoading || !ragQuery.trim()}>
              {isLoading ? "Asking..." : "Ask PawPal"}
            </button>
            <button className="btn ghost" onClick={() => setChatHistory([])} disabled={!chatHistory.length}>Clear chat</button>
          </div>

          {chatHistory.length ? (
            chatHistory.map((entry, index) => (
              <details key={`${entry.question}-${index}`} className="task-card" style={{ marginTop: 12 }}>
                <summary>Question: {entry.question}</summary>
                <p>{entry.answer}</p>
                {entry.warning && <p style={{ color: "#b45309" }}>{entry.warning}</p>}
                {entry.facts && entry.facts.length > 0 && (
                  <div>
                    <strong>Retrieved facts:</strong>
                    <ul>
                      {entry.facts.map((fact, factIndex) => (
                        <li key={`${index}-fact-${factIndex}`}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </details>
            ))
          ) : (
            <p>No chat history yet.</p>
          )}
        </section>
      </div>
    </main>
  )
}
