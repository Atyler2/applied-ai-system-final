const PromptSuggestionButton = ({ text, onClick }: { text: string; onClick: (prompt: string) => void }) => {
  return (
    <button className="prompt-suggestion-button" onClick={() => onClick(text)}>
      {text}
    </button>
  )
}

export default PromptSuggestionButton