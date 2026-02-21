
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sendMessage, getMessages } from "@/actions/message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Loader2, Paperclip, Check, CheckCheck } from "lucide-react";
import Image from "next/image";

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
    pending?: boolean;
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
    const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const allMessages = [...realMessages, ...pendingMessages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Auto-scroll to specific message if arriving from Push Notification URL hash
    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash) {
            const hash = window.location.hash;
            if (hash.startsWith("#msg-") || hash === "#chat") {
                setTimeout(() => {
                    const targetId = hash.startsWith("#msg-") ? hash.replace('#', '') : 'chat';
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                        // Add a temporary highlight effect if it's a specific message
                        if (targetId.startsWith("msg-")) {
                            targetElement.classList.add("ring-2", "ring-primary", "ring-offset-2", "transition-all", "duration-1000");
                            setTimeout(() => {
                                targetElement.classList.remove("ring-2", "ring-primary", "ring-offset-2");
                            }, 3000);
                        }
                    }
                }, 500); // Small delay to let Next.js hydrate and fetch initial messages
            }
        }
    }, [allMessages.length]); // Re-run if messages array updates and the hash is still active

    useEffect(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

            if (isNearBottom || pendingMessages.length > 0) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [allMessages.length, pendingMessages.length]);

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

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = content;
        if (!msg.trim()) return;
        setContent(""); // clear immediately

        const pendingMessage: Message = {
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
            },
            pending: true
        };

        setPendingMessages(prev => [...prev, pendingMessage]);

        try {
            const res = await sendMessage({ content: msg, eventId });

            // On success, manually inject the official record to prevent any UI flicker before polling catches it
            if (res?.message) {
                setRealMessages(prev => [...prev, res.message as Message]);
            }
        } finally {
            // Remove from local pending queue whether it succeeded or failed
            setPendingMessages(prev => prev.filter(m => m.id !== pendingMessage.id));
        }
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
                    const pendingMessage: Message = {
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
                        },
                        pending: true
                    };

                    setPendingMessages(prev => [...prev, pendingMessage]);

                    try {
                        const res = await sendMessage({
                            mediaUrl: newBlob.url,
                            mediaType: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
                            eventId
                        });

                        // Inject official database record instantly to stop UI stutter
                        if (res?.message) {
                            setRealMessages(prev => [...prev, res.message as Message]);
                        }
                    } finally {
                        setPendingMessages(prev => prev.filter(m => m.id !== pendingMessage.id));
                    }

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
                {allMessages.length === 0 && (
                    <div className="text-center text-muted-foreground mt-10">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
                {allMessages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div id={`msg-${msg.id}`} key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} scroll-mt-20 rounded-lg`}>
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
                                <div className="text-[10px] mt-1 opacity-70 flex items-center justify-end gap-1">
                                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isMe && (
                                        msg.pending ? <Check className="h-3 w-3" /> : <CheckCheck className="h-3 w-3 text-blue-200" />
                                    )}
                                </div>
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
