"use client"

import { useState, type FormEvent } from "react"
import Bubble from "./components1/bubble"
import LoadingBubble from "./components1/loadingBubble"
import PromptSuggestionRow from "./components1/promptSuggestionRow"

const Home = () => {
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const noMessage = messages.length === 0

  const sendMessage = async (content: string) => {
    if (!content?.trim()) return

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(body || "Chat request failed")
      }

      const data = await response.json()
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.text || "Sorry, I could not generate a response.",
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setError("Unable to send message. Try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await sendMessage(input)
  }

  const handlePromptClick = async (prompt: string) => {
    await sendMessage(prompt)
  }

  return (
    <main>
      <section className={noMessage ? "" : "populated"}>
        {noMessage ? (
          <>
            <div className="starter-text">
              <h1>Welcome to f1GPT</h1>
              <p>Ask a pet care question or choose a prompt to get started.</p>
            </div>
            <PromptSuggestionRow onPromptClick={handlePromptClick} />
          </>
        ) : (
          <>
            {messages.map((message) => (
              <Bubble key={message.id} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
          </>
        )}
      </section>

      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={(event) => setInput(event.target.value)}
          value={input}
          placeholder="Ask something about pet care"
        />
        <button className="send-button" type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>

      {error ? <p className="error-text">{error}</p> : null}
    </main>
  )
}

export default Home
