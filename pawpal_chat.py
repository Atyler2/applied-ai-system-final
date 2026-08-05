import os
from typing import List, Optional

from pawpal_system import Owner, Pet, Task

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")


def build_pawpal_facts(owner: Owner, pet: Pet) -> List[str]:
    facts: List[str] = []

    facts.append(
        f"Owner: {owner.name}, available time {owner.available_time_minutes} minutes."
    )
    if owner.preferences:
        facts.append(
            f"Owner preferences: {', '.join(owner.preferences)}."
        )

    facts.append(f"Active pet: {pet.name} ({pet.species}).")
    if pet.needs:
        facts.append(f"Pet needs: {', '.join(pet.needs)}.")
    if pet.notes:
        facts.append(f"Pet notes: {pet.notes}.")

    if pet.tasks:
        facts.append("Pet care tasks:")
        for task in pet.tasks:
            completed = "completed" if task.is_complete else "pending"
            recurring = f", recurring {task.recurrence}" if task.is_recurring else ""
            preferred_time = f", preferred at {task.preferred_time}" if task.preferred_time else ""
            facts.append(
                f"- {task.title}: {task.duration_minutes} minutes, priority {task.priority}{preferred_time}{recurring}, status {completed}."
            )
    else:
        facts.append("No pet tasks are currently defined.")

    return facts


def score_fact_text(query: str, text: str) -> int:
    lowered_query = query.lower()
    lowered_text = text.lower()
    score = 0
    for token in lowered_query.split():
        if token and token in lowered_text:
            score += 1
    return score


def retrieve_top_facts(query: str, owner: Owner, pet: Pet, top_k: int = 3) -> List[str]:
    facts = build_pawpal_facts(owner, pet)
    scored = [(score_fact_text(query, fact), fact) for fact in facts]
    scored.sort(key=lambda item: item[0], reverse=True)
    relevant = [fact for score, fact in scored if score > 0]
    if len(relevant) < top_k:
        relevant = [fact for _, fact in scored[:top_k]]
    return relevant[:top_k]


def get_openai_client():
    try:
        import openai
        from openai.error import OpenAIError
    except ImportError as exc:
        raise RuntimeError(
            "The openai package is not installed. Add openai to requirements.txt."
        ) from exc

    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is not set. Please set it in your environment before running PawPal+."
        )
    openai.api_key = OPENAI_API_KEY
    return openai, OpenAIError


def generate_rag_answer(
    query: str,
    owner: Owner,
    pet: Pet,
    top_k: int = 3,
) -> tuple[str, List[str]]:
    retrieved_facts = retrieve_top_facts(query, owner, pet, top_k=top_k)
    try:
        openai, OpenAIError = get_openai_client()
    except RuntimeError as exc:
        return str(exc), retrieved_facts

    try:
        context_text = "\n".join(retrieved_facts)
        system_message = (
            "You are PawPal+, a pet care assistant. Use only the supplied facts about the owner, pet, and tasks when answering questions. "
            "If the question is outside of the available PawPal data, say that you do not have enough information and offer general pet care guidance."
        )
        user_message = (
            f"Here are the available PawPal facts:\n{context_text}\n\n"
            f"Question: {query}\n\n"
            "Answer using the facts whenever possible. If you need to say you cannot answer because the facts do not cover it, do so clearly."
        )

        response = openai.ChatCompletion.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
            max_tokens=350,
            temperature=0.7,
        )
        answer = response.choices[0].message.content.strip()
        return answer, retrieved_facts
    except OpenAIError as exc:
        return (
            f"OpenAI API error: {exc}. Please verify your OPENAI_API_KEY and quota.",
            retrieved_facts,
        )
    except Exception as exc:
        return (
            f"Unexpected error calling OpenAI: {exc}",
            retrieved_facts,
        )
