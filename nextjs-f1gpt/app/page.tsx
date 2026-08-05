"use client"

import Link from "next/link"

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="hero-card">
        <p className="eyebrow">PawPal+ • React app</p>
        <h1>Plan pet care in a modern Next.js experience</h1>
        <p>
          Manage owners, pets, care tasks, and AI guidance from one polished interface without the old
          Streamlit workflow.
        </p>
        <div className="hero-actions">
          <Link className="btn primary" href="/pets">Manage pets</Link>
          <Link className="btn ghost" href="/schedule">Build schedule</Link>
          <Link className="btn ghost" href="/assistant">Open assistant</Link>
        </div>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <h2>Task planning</h2>
          <p>Create, edit, and organize care tasks with priorities and preferred times.</p>
        </article>
        <article className="feature-card">
          <h2>Scheduling insights</h2>
          <p>Generate an actionable plan and highlight potential time conflicts.</p>
        </article>
        <article className="feature-card">
          <h2>AI assistant</h2>
          <p>Ask PawPal questions using the active owner, pet, and task context.</p>
        </article>
      </section>
    </main>
  )
}
