"use client"
// import Image from "next/image"
// import f1GPTLogo from "./assets/f1GPTLogo.png"
// import { useChat } from "ai/react"
// import { Message } from "ai"
import Bubble from "./components1/bubble"
import LoadingBubble from "./components1/loadingBubble"
import PromptSuggestionRow from "./components1/promptSuggestionRow"


const Home = () => {
  const {append, isLoading, messages, input, handleInputChange, handleSubmit} = useChat()
  // const { messages } = useChat()
  // const noMessage = messages.length === 0
  const noMessage = false

  const handlepompt = (prompt) => {
    const msg - {
      id: crypto.randomUUID(),
      role: "user",
      content: promptText,
    }
    append(msg)
    }
  }
  return (
    <main>
      {/* <Image src={f1GPTLogo} width={250} alt="f1GPT Logo" /> */}
      <section className = {noMessage ? "": "populated"}>
        {noMessage ? (
          <>
            <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
            <br />
            <PromptSuggestionRow onPromptClick= {handlepompt}/> 
          </>
        ) : (
          <>
            {messages.map((message, index) => <Bubble key = {`${message}-${index}`} message = {message}/>)}
            *<Loading Bubble />
          </>
        )}
        
      </section>
      <form onSubmit = {handleSubmit}>
          <input className = "question-box" onChange = {handleInputChange} value = {input} placeholder = "Ask ne something"/>
          <input type = "submit" />

        </form>
    </main>
  )
}

export default Home
