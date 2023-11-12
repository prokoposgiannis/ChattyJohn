import { ChatSideBar } from "components/ChatSideBar";
import { Message } from "components/Message";
import { useState } from "react";
import { streamReader } from "openai-edge-stream";
import { v4 as uuid } from "uuid";

import Head from "next/head";

export default function ChatPage() {
  const [messageText, setMessageText] = useState("");
  const [incomingMessage, setIncomingMessage] = useState("");
  const [newChatMessages, setNewChatMessages] = useState([
    {
      _id: 1,
      role: "assistant",
      content: "Example assistant content",
    },
  ]);
  const [generatingResponse, setGeneratingResponse] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneratingResponse(true);
    setNewChatMessages((prev) => {
      const newChatMessages = [
        ...prev,
        { _id: uuid(), role: "user", content: messageText },
      ];
      return newChatMessages;
    });

    setMessageText("");

    const response = await fetch(`/api/chat/sendMessage`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: messageText }),
    });
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    await streamReader(reader, (message) => {
      setIncomingMessage((state) => `${state}${message.content}`);
    });

    setGeneratingResponse(false);
  };
  return (
    <>
      <Head>
        <title>New chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr] ">
        <ChatSideBar />
        <div className="flex flex-col bg-gray-700">
          <div className="flex-1 text-white">
            {newChatMessages.map((message) => (
              <Message
                key={message._id}
                role={message.role}
                content={message.content}
              />
            ))}

            {!!incomingMessage && (
              <Message role="assistant" content={incomingMessage} />
            )}
          </div>
          <footer className="p bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset className="flex gap-2" disabled={generatingResponse}>
                <textarea
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                  }}
                  placeholder={generatingResponse ? "" : "Send a message..."}
                  className="w-full resize-none rounded-md bg-gray-700 p-2 text-white focus:border-emerald-500 focus:bg-gray-600 focus:outline focus:outline-emerald-500"
                />
                <button type="submit" className="btn">
                  Send
                </button>
              </fieldset>
            </form>
          </footer>
        </div>
      </div>
    </>
  );
}
