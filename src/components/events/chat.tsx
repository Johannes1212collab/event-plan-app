"use client";

import { useChat, Message } from "@/hooks/use-chat";
import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";

interface ChatProps {
    eventId: string;
    initialMessages: Message[];
    currentUserId: string;
}

export const Chat = ({ eventId, initialMessages, currentUserId }: ChatProps) => {
    const chat = useChat({ eventId, initialMessages, currentUserId });

    return (
        <div id="chat" className="flex flex-col min-h-[400px] h-[500px] md:h-[600px] border rounded-lg bg-background shadow-sm overflow-hidden relative">
            <ChatMessageList
                messages={chat.allMessages}
                currentUserId={currentUserId}
                setReplyingTo={chat.setReplyingTo}
                inputRef={chat.inputRef}
                scrollRef={chat.scrollRef}
                handleNativeDownload={chat.handleNativeDownload}
            />
            <ChatInput
                content={chat.content}
                setContent={chat.setContent}
                isUploading={chat.isUploading}
                replyingTo={chat.replyingTo}
                setReplyingTo={chat.setReplyingTo}
                fileInputRef={chat.fileInputRef}
                inputRef={chat.inputRef}
                onSubmit={chat.onSubmit}
                handleUpload={chat.handleUpload}
                handleInputFocus={chat.handleInputFocus}
                handleInputBlur={chat.handleInputBlur}
                isInputFocused={chat.isInputFocused}
            />
        </div>
    );
};
