import React, { useState, useEffect, useRef } from 'react'
import { SSE } from 'sse.js'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from './components/custom-button'

const ConversationContainer = styled.div`
    display: flex;
    flex-direction: column;
    scrollbar-color: grey;
    scrollbar-width: thin;
    height: 500px;
    overflow-y: scroll;
    overflow-x: hidden;
    background: #f8f8f8;
    margin: 20px 20px 10px 20px;
`
const PromptChatDiv = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`

const StyledChatInput = styled.div`
    margin-top: 15px;
    display: block;
    text-align: center;
`

const StyledTextArea = styled.textarea`
    width: 90%;
    height: 120px;
    padding: 12px 20px;
    box-sizing: border-box;
    border: 2px solid #ccc;
    border-radius: 4px;
    background-color: #f8f8f8;
    font-size: 16px;
    resize: none;
`
const Message = styled.div`
    border-color: #ccc;
    background-color: ${(props) =>
        props.variant === 'primary' ? '#e4e4e4' : '#f8f8f8'};
    padding: 5px;
    color: black;
    width: 100%;
`

export function App() {
    const [userInput, setUserInput] = useState('')
    const [conversationContext, setConversationContext] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [response, setResponse] = useState('')
    const responseRef = useRef('')

    useEffect(() => {
        if (userInput.length) {
            submitQuestionStream()
        }
    }, [conversationContext])

    useEffect(() => {
        response.length &&
            setConversationContext((prevConversationContext) => {
                const lastMessage =
                    prevConversationContext[prevConversationContext.length - 1]

                if (lastMessage && lastMessage.role === 'assistant') {
                    // Update the last message from the assistant with the new content
                    return prevConversationContext.map((item, index) =>
                        index === prevConversationContext.length - 1
                            ? { role: 'assistant', content: response }
                            : item
                    )
                } else {
                    // If the last message is not from the server, add a new server message
                    return [
                        ...prevConversationContext,
                        { role: 'assistant', content: response },
                    ]
                }
            })
    }, [response])

    const renderConversation = () => {
        let variants = {
            user: 'primary',
            assistant: 'secondary',
        }
        const filteredConvo = conversationContext.filter(
            (item) => item.role !== 'system'
        )

        return filteredConvo.map((conversationItem, i) => {
            return (
                <Message
                    variant={variants[conversationItem.role]}
                    key={variants[conversationItem.role] + i}
                >
                    <ReactMarkdown
                        children={conversationItem.content}
                        remarkPlugins={[remarkGfm]}
                    />
                    {/* {conversationItem.content} */}
                </Message>
            )
        })
    }

    const prompt = () => {
        const defaultInput = `You are a chat bot. Please return all responses in Markdown.`

        return { role: 'system', content: defaultInput }
    }

    const combinePrompts = () => {
        const sysPrompt = prompt()

        const initialUserInput = { role: 'user', content: userInput }
        setConversationContext((prevConversationContext) => [
            ...prevConversationContext,
            sysPrompt,
            initialUserInput,
        ])

        return [sysPrompt, initialUserInput]
    }

    const submitQuestionStream = async () => {
        const API_URL = `https://api.openai.com/v1/chat/completions`
        setIsLoading(true)
        responseRef.current = ''
        setResponse('')
        setUserInput('')
        const config = {
            model: 'gpt-4',
            messages: !conversationContext.length
                ? combinePrompts()
                : conversationContext,
            max_tokens: 600,
            n: 1,
            temperature: 0.5,
            stream: true,
        }

        const source = new SSE(API_URL, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.REACT_APP_CHAT_API_KEY}`, // set this yourself
            },
            payload: JSON.stringify(config),
        })
        setIsLoading(false)
        source.addEventListener('message', (e) => {
            const jsonObjectsRegExp = /{[\s\S]+?}(?=data:|$)/g
            const jsonObjectsMatches = e.data.match(jsonObjectsRegExp)

            if (jsonObjectsMatches) {
                // Parse the JSON objects and store them in an array
                const objectsArray = jsonObjectsMatches.map((json) =>
                    JSON.parse(json)
                )

                if (
                    objectsArray &&
                    !!objectsArray[0].choices[0].delta.content
                ) {
                    responseRef.current =
                        responseRef.current +
                        objectsArray[0].choices[0].delta.content
                    setResponse(responseRef.current)
                    setIsLoading(false)
                }
            } else {
                source.close()
            }
        })

        source.stream()
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        submitQuestionStream()
    }

    const handleReset = (event) => {
        event.preventDefault()
        setUserInput('')
        setConversationContext([])
    }

    return (
        <PromptChatDiv>
            <ConversationContainer>
                {renderConversation()}
            </ConversationContainer>

            <StyledChatInput>
                <form>
                    <StyledTextArea
                        autoFocus={true}
                        disabled={isLoading}
                        value={userInput}
                        onChange={(event) => setUserInput(event.target.value)}
                    />
                    <br />

                    {isLoading && 'Loading...'}
                    {!isLoading && (
                        <>
                            <Button
                                disabled={!userInput.length}
                                buttonText="Submit"
                                type="submit"
                                onClickHandler={handleSubmit}
                            />
                            <Button
                                buttonText="Reset"
                                type="reset"
                                onClickHandler={(e) => handleReset(e)}
                            />
                        </>
                    )}
                </form>
            </StyledChatInput>
        </PromptChatDiv>
    )
}

export default App
