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

// Scheduling helpers (ported from pawpal_system.Scheduler / DailyPlan)
export function priorityScore(task: Task) {
  const map: Record<string, number> = { low: 1, medium: 2, high: 3 }
  return map[(task.priority || "medium").toLowerCase()] || 2
}

export function isFeasible(task: Task, availableMinutes: number) {
  return task.duration_minutes <= Math.max(0, availableMinutes)
}

export function scheduleKey(task: Task): string | null {
  if (!task.preferred_time) return null
  return `${task.preferred_time}::${task.due_date || ""}`
}

export function sortByPriorityDurationTitle(tasks: Task[]) {
  return tasks.slice().sort((a, b) => {
    const pa = priorityScore(a)
    const pb = priorityScore(b)
    if (pa !== pb) return pb - pa
    if (a.duration_minutes !== b.duration_minutes) return a.duration_minutes - b.duration_minutes
    return a.title.localeCompare(b.title)
  })
}

export function sortByTime(tasks: Task[]) {
  return tasks.slice().sort((a, b) => {
    const parse = (t?: string | null) => {
      if (!t) return [99, 99]
      const parts = t.split(":").map((s) => parseInt(s, 10))
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return [99, 99]
      return parts
    }
    const ta = parse(a.preferred_time)
    const tb = parse(b.preferred_time)
    if (ta[0] !== tb[0]) return ta[0] - tb[0]
    return ta[1] - tb[1]
  })
}

export function generatePlan(owner: Owner, pet: Pet) {
  const availableTime = owner.available_time_minutes
  const candidateTasks: Task[] = pet.tasks ? pet.tasks.slice() : []
  const selected: Task[] = []
  for (const task of sortByPriorityDurationTitle(candidateTasks)) {
    if (selected.includes(task)) continue
    if (isFeasible(task, availableTime - selected.reduce((s, t) => s + t.duration_minutes, 0))) {
      selected.push(task)
    }
  }
  return selected
}

export function explainPlan(tasks: Task[]) {
  if (!tasks || tasks.length === 0) return ["No tasks fit in the available time for today."]
  return tasks.map((t) => `${t.title} was included because it is a ${t.priority || "medium"} priority task that fits within the remaining time.`)
}

export function detectTimeConflicts(tasks: Task[]) {
  const map: Record<string, Task[]> = {}
  for (const t of tasks) {
    if (t.is_complete) continue
    const key = scheduleKey(t)
    if (!key) continue
    map[key] = map[key] || []
    map[key].push(t)
  }
  const warnings: string[] = []
  for (const k of Object.keys(map)) {
    if (map[k].length < 2) continue
    const parts = k.split("::")
    const time = parts[0]
    const due = parts[1]
    const dateInfo = due ? ` on ${due}` : ""
    const taskList = map[k].map((t) => `'${t.title}' (${t.title})`).join(", ")
    warnings.push(`Warning: tasks scheduled at the same time${dateInfo}: ${taskList}.`)
  }
  return warnings
}

export function warnConflicts(tasks: Task[]) {
  const w = detectTimeConflicts(tasks)
  return w.length ? w.join("\n") : "No scheduling conflicts detected."
}
