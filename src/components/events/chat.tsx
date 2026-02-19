
"use client";

import { useState, useRef, useEffect } from "react";
import { sendMessage } from "@/actions/message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Loader2, Paperclip } from "lucide-react";
import Image from "next/image";
import { useOptimistic } from "react";

interface Message {
    id: string;
    content: string | null;
    mediaUrl: string | null;
    mediaType: string | null;
    senderId: string;
    createdAt: Date;
    sender: {
        name: string | null;
        image: string | null;
        id: string;
    };
}

interface ChatProps {
    eventId: string;
    initialMessages: Message[];
    currentUserId: string;
}

export const Chat = ({ eventId, initialMessages, currentUserId }: ChatProps) => {
    const [content, setContent] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Simple optimistic UI
    const [optimisticMessages, addOptimisticMessage] = useOptimistic(
        initialMessages,
        (state, newMessage: Message) => [...state, newMessage]
    );

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [optimisticMessages]);

    const handleSendMessage = async (mediaUrl?: string, mediaType?: string) => {
        if (!content && !mediaUrl) return;

        const optimisticMessage: Message = {
            id: Math.random().toString(),
            content: content,
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || null,
            senderId: currentUserId,
            createdAt: new Date(),
            sender: {
                name: "You", // Better if we pass user name in props
                image: null,
                id: currentUserId
            }
        };

        addOptimisticMessage(optimisticMessage);
        setContent("");

        await sendMessage({
            content, // capture current content before clearing? No, already cleared locally but kept in closure? 
            // Better pass directly.
            // Actually content checks closure value which might be stale if typed fast?
            // Safe to pass `content` from closure as it's state at call time? 
            // Wait, I cleared content after calling addOptimisticMessage.
            // I should capture it.
            mediaUrl,
            mediaType,
            eventId
        });
        // Note: sendMessage reads `content` from arg I pass, not state if I pass literal.
        // Wait, function def needs arguments. 
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = content;
        setContent(""); // clear immediately

        // Add optimistic
        const optimisticMessage: Message = {
            id: Math.random().toString(),
            content: msg,
            mediaUrl: null,
            mediaType: null,
            senderId: currentUserId,
            createdAt: new Date(),
            sender: {
                name: "You",
                image: null,
                id: currentUserId
            }
        };
        addOptimisticMessage(optimisticMessage);

        await sendMessage({ content: msg, eventId });
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);

        try {
            const { upload } = await import('@vercel/blob/client');

            const uploadPromises = Array.from(files).map(async (file) => {
                try {
                    const newBlob = await upload(file.name, file, {
                        access: 'public',
                        handleUploadUrl: '/api/upload',
                    });

                    // Send message with media
                    const optimisticMessage: Message = {
                        id: Math.random().toString(),
                        content: "",
                        mediaUrl: newBlob.url,
                        mediaType: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
                        senderId: currentUserId,
                        createdAt: new Date(),
                        sender: {
                            name: "You",
                            image: null,
                            id: currentUserId
                        }
                    };
                    addOptimisticMessage(optimisticMessage);
                    await sendMessage({
                        mediaUrl: newBlob.url,
                        mediaType: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
                        eventId
                    });
                } catch (err) {
                    console.error(`Failed to upload file: ${file.name}`, err);
                    // Could add a toast here for individual failure
                }
            });

            await Promise.all(uploadPromises);

        } catch (error) {
            console.error("Critical upload error", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col h-[600px] border rounded-lg bg-white shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                {optimisticMessages.length === 0 && (
                    <div className="text-center text-slate-400 mt-10">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
                {optimisticMessages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? "bg-blue-600 text-white" : "bg-white border text-slate-800"}`}>
                                {!isMe && <p className="text-xs font-bold mb-1 opacity-70">{msg.sender.name}</p>}
                                {msg.mediaUrl && (
                                    <div className="mb-2 rounded overflow-hidden">
                                        {msg.mediaType === "IMAGE" ? (
                                            <img src={msg.mediaUrl} alt="Shared media" className="max-w-full h-auto object-cover" />
                                        ) : (
                                            <video src={msg.mediaUrl} controls className="max-w-full h-auto" />
                                        )}
                                    </div>
                                )}
                                {msg.content && <p>{msg.content}</p>}
                                <p className="text-[10px] mt-1 opacity-70 text-right">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="p-4 bg-white border-t">
                <form onSubmit={onSubmit} className="flex gap-2 items-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleUpload}
                    />
                    <Input
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button type="submit" disabled={!content.trim() && !isUploading} size="icon">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};
