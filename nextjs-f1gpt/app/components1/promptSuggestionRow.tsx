import PromptSuggestionButton from "./PromptSuggestionButton"

const prompts = [
  "When should I walk my dog?",
  "How often should I feed my cat?",
  "What are the best ways to groom my horse?",
]

const PromptSuggestionRow = ({ onPromptClick }: { onPromptClick: (prompt: string) => void }) => {
  return (
    <div className="prompt-suggestion-row">
      {prompts.map((prompt, index) => (
        <PromptSuggestionButton key={`suggestion-${index}`} text={prompt} onClick={() => onPromptClick(prompt)} />
      ))}
    </div>
  )
}

export default PromptSuggestionRow