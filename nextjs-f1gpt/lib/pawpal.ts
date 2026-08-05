export type Task = {
  title: string
  duration_minutes: number
  priority?: "low" | "medium" | "high"
  category?: string
  is_recurring?: boolean
  recurrence?: string | null
  preferred_time?: string | null
  due_date?: string | null
  is_complete?: boolean
}

export type Pet = {
  name: string
  species: string
  needs?: string[]
  notes?: string | null
  tasks?: Task[]
}

export type Owner = {
  name: string
  available_time_minutes: number
  preferences?: string[]
  pets?: Pet[]
}

export function buildPawpalFacts(owner: Owner, pet: Pet): string[] {
  const facts: string[] = []
  facts.push(`Owner: ${owner.name}, available ${owner.available_time_minutes} minutes`)
  if (owner.preferences && owner.preferences.length) {
    facts.push(`Owner preferences: ${owner.preferences.join(", ")}`)
  }
  facts.push(`Pet: ${pet.name} (${pet.species})`)
  if (pet.needs && pet.needs.length) {
    facts.push(`Pet needs: ${pet.needs.join(", ")}`)
  }
  if (pet.notes) facts.push(`Pet notes: ${pet.notes}`)
  const tasks = pet.tasks || []
  for (const t of tasks) {
    facts.push(`Task: ${t.title} | duration: ${t.duration_minutes}m | priority: ${t.priority || "medium"} | preferred: ${t.preferred_time || ""} | recurring: ${t.is_recurring ? t.recurrence || "yes" : "no"}`)
  }
  return facts
}

export function similarity(a: number[], b: number[]) {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}
