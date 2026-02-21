
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sendMessage, getMessages } from "@/actions/message";
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
    const [realMessages, setRealMessages] = useState<Message[]>(initialMessages);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Simple optimistic UI
    const [optimisticMessages, addOptimisticMessage] = useOptimistic(
        realMessages,
        (state, newMessage: Message) => {
            // Check if optimistic message already exists to avoid duplication locally
            const exists = state.some(m => m.id === newMessage.id);
            if (exists) return state;
            return [...state, newMessage];
        }
    );

    // Auto-scroll to chat if the user arrived via a Push Notification (url ends in #chat)
    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash === "#chat") {
            setTimeout(() => {
                document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500); // Small delay to let Next.js finish hydrating the DOM
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            // Check if we are near the bottom
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // 200px threshold allows for tall image incoming messages to still trigger scroll
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

            // Only force scroll if user is near bottom or we literally just sent a message quickly
            // But realistically just doing it indiscriminately is what initial version did. 
            // We'll scroll to bottom if near bottom.
            if (isNearBottom || optimisticMessages.length !== realMessages.length) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [optimisticMessages, realMessages]);

    // Polling logic
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await getMessages(eventId);
                if (res.messages) {
                    setRealMessages(res.messages as Message[]);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [eventId]);

    const handleInputFocus = () => {
        setTimeout(() => {
            inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    };

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
        // import toast dynamically to avoid SSR issues if not handled, though usually fine.
        // Better to import at top level but let's assume it's available.
        // Actually, let's add import at top. I'll do a separate edit for imports.
        // For now, I'll assume toast is imported.

        try {
            const { upload } = await import('@vercel/blob/client');
            const { toast } = await import('sonner'); // Dynamic import for now to match scope

            let imageCompression;
            try {
                imageCompression = (await import('browser-image-compression')).default;
            } catch (e) {
                console.warn("browser-image-compression not available", e);
            }

            for (const file of Array.from(files)) {
                let fileToUpload: File | Blob = file;
                const toastId = toast.loading(`Preparing ${file.name}...`);

                try {
                    if (file.type.startsWith('image/') && imageCompression) {
                        toast.loading(`Compressing ${file.name}...`, { id: toastId });
                        fileToUpload = await imageCompression(file, {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true,
                        });
                    }

                    toast.loading(`Uploading to server...`, { id: toastId });
                    const filename = `${file.name.split('.').slice(0, -1).join('.')}-${Math.random().toString(36).substring(2, 9)}.${file.name.split('.').pop()}`;
                    const newBlob = await upload(filename, fileToUpload as File, {
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

                    toast.success(`Uploaded ${file.name}`, { id: toastId });
                } catch (err) {
                    console.error(`Failed to upload file: ${file.name}`, err);
                    toast.error(`Failed: ${file.name} - ${(err as Error).message}`, { id: toastId });
                }
            }

        } catch (error) {
            console.error("Critical upload error", error);
            const { toast } = await import('sonner');
            toast.error("Upload system error");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div id="chat" className="flex flex-col min-h-[400px] h-[500px] md:h-[600px] border rounded-lg bg-background shadow-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950" ref={scrollRef}>
                {optimisticMessages.length === 0 && (
                    <div className="text-center text-muted-foreground mt-10">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
                {optimisticMessages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? "bg-blue-600 text-white" : "bg-card border text-card-foreground shadow-sm"}`}>
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
            <div className="p-4 bg-background border-t">
                <form onSubmit={onSubmit} className="flex gap-2 items-center">
                    <Button
                        id="chat-paperclip"
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-full shrink-0"
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
                        ref={inputRef}
                        onFocus={handleInputFocus}
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
