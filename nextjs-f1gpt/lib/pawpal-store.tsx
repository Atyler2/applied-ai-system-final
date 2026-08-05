"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { completeTask as completeTaskModel } from "./pawpal"
import type { Owner, Pet, Task } from "./pawpal"

const STORAGE_KEY = "pawpal_owner_state_v1"

const defaultOwner: Owner = {
  name: "Jordan",
  available_time_minutes: 180,
  preferences: [],
  pets: [{ name: "Mochi", species: "dog", tasks: [] }],
}

type PawpalStoreValue = {
  owner: Owner
  pets: Pet[]
  activePetIndex: number
  activePet: Pet
  setOwnerName: (name: string) => void
  setAvailableMinutes: (minutes: number) => void
  setActivePetIndex: (index: number) => void
  addPet: (name: string, species: string) => void
  removeActivePet: () => { removed: boolean; removedName?: string }
  addTask: (task: Task) => void
  updateTask: (index: number, task: Task) => void
  deleteTask: (index: number) => void
  completeTask: (index: number) => { createdNext: boolean }
}

const PawpalStoreContext = createContext<PawpalStoreValue | null>(null)

function normalizeTask(task: Task): Task {
  const preferredTime = task.preferred_time?.trim() || ""
  const dueDate = task.due_date?.trim() || ""
  const title = task.title?.trim() || "Untitled task"

  return {
    ...task,
    title,
    duration_minutes: Math.max(1, Number(task.duration_minutes) || 1),
    category: task.category?.trim() || "general",
    preferred_time: preferredTime || null,
    due_date: dueDate || null,
    is_recurring: Boolean(task.is_recurring),
    recurrence: task.is_recurring ? task.recurrence || "daily" : null,
    is_complete: Boolean(task.is_complete),
  }
}

function normalizeOwner(raw: Owner): Owner {
  const pets = (raw.pets || []).map((pet) => ({
    ...pet,
    tasks: (pet.tasks || []).map((task) => normalizeTask(task)),
  }))

  return {
    ...raw,
    name: raw.name || "Jordan",
    available_time_minutes: Math.max(0, Number(raw.available_time_minutes) || 0),
    pets: pets.length ? pets : [{ name: "Mochi", species: "dog", tasks: [] }],
  }
}

export function PawpalStoreProvider({ children }: { children: React.ReactNode }) {
  const [owner, setOwner] = useState<Owner>(defaultOwner)
  const [activePetIndex, setActivePetIndexState] = useState(0)
  const pets = owner.pets || []
  const safeIndex = Math.max(0, Math.min(activePetIndex, Math.max(0, pets.length - 1)))
  const activePet = pets[safeIndex] || { name: "Mochi", species: "dog", tasks: [] }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { owner?: Owner; activePetIndex?: number }
      const nextOwner = normalizeOwner(parsed.owner || defaultOwner)
      const nextIndex = Math.max(0, Math.min(Number(parsed.activePetIndex) || 0, (nextOwner.pets || []).length - 1))
      setOwner(nextOwner)
      setActivePetIndexState(nextIndex)
    } catch {
      setOwner(defaultOwner)
      setActivePetIndexState(0)
    }
  }, [])

  useEffect(() => {
    if (!pets.length) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ owner, activePetIndex: safeIndex }))
  }, [owner, safeIndex, activePetIndex, pets.length])

  function setActivePetIndex(index: number) {
    const bounded = Math.max(0, Math.min(index, Math.max(0, pets.length - 1)))
    setActivePetIndexState(bounded)
  }

  function setOwnerName(name: string) {
    setOwner((prev) => ({ ...prev, name }))
  }

  function setAvailableMinutes(minutes: number) {
    setOwner((prev) => ({ ...prev, available_time_minutes: Math.max(0, Number(minutes) || 0) }))
  }

  function addPet(name: string, species: string) {
    const petName = name.trim() || "New Pet"
    const nextPets = [...pets, { name: petName, species, tasks: [] }]
    setOwner((prev) => ({ ...prev, pets: nextPets }))
    setActivePetIndexState(nextPets.length - 1)
  }

  function removeActivePet() {
    if (pets.length <= 1) return { removed: false }
    const removedName = pets[safeIndex]?.name
    const nextPets = pets.filter((_, index) => index !== safeIndex)
    const nextIndex = Math.max(0, Math.min(safeIndex, nextPets.length - 1))
    setOwner((prev) => ({ ...prev, pets: nextPets }))
    setActivePetIndexState(nextIndex)
    return { removed: true, removedName }
  }

  function addTask(task: Task) {
    const nextTask = normalizeTask(task)
    setOwner((prev) => {
      const nextPets = (prev.pets || []).map((petItem, index) => {
        if (index !== safeIndex) return petItem
        return { ...petItem, tasks: [...(petItem.tasks || []), nextTask] }
      })
      return { ...prev, pets: nextPets }
    })
  }

  function updateTask(index: number, task: Task) {
    const nextTask = normalizeTask(task)
    setOwner((prev) => {
      const nextPets = (prev.pets || []).map((petItem, petIndex) => {
        if (petIndex !== safeIndex) return petItem
        const nextTasks = (petItem.tasks || []).slice()
        nextTasks[index] = nextTask
        return { ...petItem, tasks: nextTasks }
      })
      return { ...prev, pets: nextPets }
    })
  }

  function deleteTask(index: number) {
    setOwner((prev) => {
      const nextPets = (prev.pets || []).map((petItem, petIndex) => {
        if (petIndex !== safeIndex) return petItem
        return { ...petItem, tasks: (petItem.tasks || []).filter((_, taskIndex) => taskIndex !== index) }
      })
      return { ...prev, pets: nextPets }
    })
  }

  function completeTask(index: number) {
    const targetTask = activePet.tasks?.[index]
    if (!targetTask) return { createdNext: false }
    const completionResult = completeTaskModel(targetTask)

    setOwner((prev) => {
      const nextPets = (prev.pets || []).map((petItem, petIndex) => {
        if (petIndex !== safeIndex) return petItem
        const nextTasks = (petItem.tasks || []).slice()
        nextTasks[index] = completionResult.updatedTask
        if (completionResult.nextTask) {
          nextTasks.push(completionResult.nextTask)
        }
        return { ...petItem, tasks: nextTasks }
      })
      return { ...prev, pets: nextPets }
    })

    return { createdNext: Boolean(completionResult.nextTask) }
  }

  const value = useMemo(
    () => ({
      owner,
      pets,
      activePetIndex: safeIndex,
      activePet,
      setOwnerName,
      setAvailableMinutes,
      setActivePetIndex,
      addPet,
      removeActivePet,
      addTask,
      updateTask,
      deleteTask,
      completeTask,
    }),
    [owner, pets, safeIndex, activePet]
  )

  return <PawpalStoreContext.Provider value={value}>{children}</PawpalStoreContext.Provider>
}

export function usePawpalStore() {
  const context = useContext(PawpalStoreContext)
  if (!context) {
    throw new Error("usePawpalStore must be used inside PawpalStoreProvider")
  }
  return context
}
