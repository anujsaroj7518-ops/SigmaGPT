import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import "./Chat.css";
import { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";

function Chat() {
    const { newChat, prevChats, reply, setPrompt, setPrevChats, setReply } = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);
    const [copiedIdx, setCopiedIdx] = useState(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);   // NEW
    const chatEndRef = useRef(null);
    const chatsContainerRef = useRef(null);                      // NEW

    // Typewriter effect
    useEffect(() => {
        if (reply === null) {
            setLatestReply(null);
            return;
        }

        if (!prevChats?.length || !reply) return;

        const content = reply.split("");
        const chunkSize = 3;
        let idx = 0;

        const interval = setInterval(() => {
            idx += chunkSize;
            setLatestReply(content.slice(0, idx).join(""));
            if (idx >= content.length) clearInterval(interval);
        }, 20);

        return () => clearInterval(interval);
    }, [prevChats, reply]);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [latestReply, prevChats]);

    // NEW: scroll position track karke button show/hide
    useEffect(() => {
        const container = chatsContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            setShowScrollBtn(distanceFromBottom > 150);
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToBottom = () => {                                // NEW
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 1500);
    };

    const handleShare = async (text) => {
        if (navigator.share) {
            try {
                await navigator.share({ text });
            } catch (err) {
                console.log(err);
            }
        } else {
            navigator.clipboard.writeText(text);
        }
    };

    const handleEdit = (idx) => {
        setPrompt(prevChats[idx].content);
        setPrevChats(prev => prev.slice(0, idx));
        setReply(null);
    };

    return (
        <div className="chatsWrapper">
            {newChat && <h1>Start a New Chat!</h1>}
            <div className="chats" ref={chatsContainerRef}>       {/* NEW: ref add hua */}
                {
                    prevChats?.slice(0, -1).map((chat, idx) =>
                        <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={idx}>
                            {
                                chat.role === "user" ?
                                    <>
                                        <p className="userMessage">{chat.content}</p>
                                        <div className="messageActions">
                                            <i className="fa-solid fa-copy" title="Copy" onClick={() => handleCopy(chat.content, idx)}></i>
                                            <i className="fa-solid fa-arrow-up-from-bracket" title="Share" onClick={() => handleShare(chat.content)}></i>
                                            <i className="fa-solid fa-pen" title="Edit message" onClick={() => handleEdit(idx)}></i>
                                        </div>
                                        {copiedIdx === idx && <span className="copiedTag">Copied!</span>}
                                    </> :
                                    <div className="gptMessage">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                                            {chat.content || ""}
                                        </ReactMarkdown>
                                    </div>
                            }
                        </div>
                    )
                }

                {
                    prevChats.length > 0 && (
                        <>
                            {
                                latestReply === null ? (
                                    <div className="gptDiv" key={"non-typing"}>
                                        <div className="gptMessage">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                                                {prevChats[prevChats.length - 1]?.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="gptDiv" key={"typing"}>
                                        <div className="gptMessage">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                                                {latestReply}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )
                            }
                        </>
                    )
                }

                <div ref={chatEndRef} />
            </div>

            {showScrollBtn && (                                   
                <button className="scrollDownBtn" onClick={scrollToBottom}>
                    <i className="fa-solid fa-arrow-down"></i>
                </button>
            )}
        </div>
    );
}

export default Chat;