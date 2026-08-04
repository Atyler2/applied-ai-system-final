const PromptSuggestionRow = () => {
    const PromptSuggestionRow = ({onPromptClick}) => [
        "When should I walk my dog?"
        "How often should I feed my cat?"
        "What are the best ways to groom my horse?"
    ]
    
    
    return (
        <div className="prompt-suggestion-row">
            {prompts.map((prompt, index) => (
                <PromptSuggestionButton key={"suggestion-${index}"}
                 text = {prompt} onClick = {() => onPromptClick(prompt)} />
            ))}
        </div>
    )
}

export default PromptSuggestionRow