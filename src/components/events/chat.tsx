
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sendMessage, getMessages } from "@/actions/message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Loader2, Paperclip, Check, CheckCheck, Download, X, Reply } from "lucide-react";
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
    replyToId?: string | null;
    replyTo?: {
        id: string;
        content: string | null;
        sender: {
            name: string | null;
        }
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
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [realMessages, setRealMessages] = useState<Message[]>(initialMessages);
    const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
    const [isInputFocused, setIsInputFocused] = useState(false);
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

                        // Remove the hash from the URL so future message polling doesn't trigger the scroll again
                        window.history.replaceState(null, '', window.location.pathname + window.location.search);
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
                    setRealMessages(res.messages as unknown as Message[]);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [eventId]);

    const handleInputFocus = () => {
        setIsInputFocused(true);
        setTimeout(() => {
            if (window.visualViewport) {
                inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 400); // Wait for keyboard animation to fully complete
    };

    const handleInputBlur = () => {
        setIsInputFocused(false);
    };

    const handleNativeDownload = async (mediaUrl: string) => {
        try {
            if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
                // Import toast dynamically here as well since it's used inside the component body
                const { toast } = await import('sonner');
                const toastId = toast.loading("Preparing file for camera roll...");
                const response = await fetch(mediaUrl);
                const blob = await response.blob();
                const filename = mediaUrl.split('/').pop() || 'media-download';
                const file = new File([blob], filename, { type: blob.type });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    toast.dismiss(toastId);
                    await navigator.share({
                        files: [file],
                        title: 'Save to Camera Roll',
                    });
                    return;
                }
                toast.dismiss(toastId);
            }

            // Fallback for Desktop/unsupported
            const link = document.createElement('a');
            link.href = `/api/download?url=${encodeURIComponent(mediaUrl)}`;
            link.download = '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download handling error:", error);
            if ((error as any).name !== 'AbortError') {
                const { toast } = await import('sonner');
                toast.error("Could not save media.");
            }
        }
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
            replyToId: replyingTo?.id,
            replyTo: replyingTo ? {
                id: replyingTo.id,
                content: replyingTo.content,
                sender: { name: replyingTo.sender.name }
            } : undefined,
            pending: true
        };

        setPendingMessages(prev => [...prev, pendingMessage]);

        try {
            const res = await sendMessage({ content: msg, eventId, replyToId: replyingTo?.id });
            setReplyingTo(null);

            // On success, manually inject the official record to prevent any UI flicker before polling catches it
            if (res?.message) {
                setRealMessages(prev => [...prev, res.message as unknown as Message]);
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
                            setRealMessages(prev => [...prev, res.message as unknown as Message]);
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
        <>
            <div id="chat" className="flex flex-col min-h-[400px] h-[500px] md:h-[600px] border rounded-lg bg-background shadow-sm overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950" ref={scrollRef}>
                    {allMessages.length === 0 && (
                        <div className="text-center text-muted-foreground mt-10">
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    )}
                    {allMessages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div
                                id={`msg-${msg.id}`}
                                key={msg.id}
                                className={`flex ${isMe ? "justify-end" : "justify-start"} scroll-mt-20 rounded-lg select-none`}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setReplyingTo(msg);
                                    setTimeout(() => inputRef.current?.focus(), 50);
                                }}
                            >
                                <div className={`max-w-[75%] rounded-lg p-3 ${isMe ? "bg-blue-600 text-white" : "bg-card border text-card-foreground shadow-sm"}`}>
                                    {!isMe && <p className="text-xs font-bold mb-1 opacity-70">{msg.sender.name}</p>}

                                    {/* Quoted Message Block */}
                                    {msg.replyTo && (
                                        <div
                                            onClick={() => {
                                                const target = document.getElementById(`msg-${msg.replyTo!.id}`);
                                                if (target) {
                                                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    target.classList.add("ring-2", "ring-primary", "ring-offset-2", "transition-all", "duration-1000");
                                                    setTimeout(() => target.classList.remove("ring-2", "ring-primary", "ring-offset-2"), 2000);
                                                }
                                            }}
                                            className={`text-xs mb-2 p-2 rounded border-l-4 cursor-pointer hover:opacity-80 transition-opacity ${isMe ? "bg-blue-700/50 border-blue-300 text-blue-50" : "bg-muted border-primary/50 text-muted-foreground"}`}
                                        >
                                            <p className="font-semibold text-[10px] mb-0.5 flex items-center gap-1">
                                                <Reply className="h-3 w-3" />
                                                {msg.replyTo.sender.name}
                                            </p>
                                            <p className="line-clamp-2 truncate">
                                                {msg.replyTo.content || "Attached media"}
                                            </p>
                                        </div>
                                    )}
                                    {msg.mediaUrl && (
                                        <div
                                            className="mb-2 rounded overflow-hidden cursor-pointer relative group"
                                            onClick={() => handleNativeDownload(msg.mediaUrl!)}
                                        >
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                                                <Download className="text-white h-6 w-6 drop-shadow-md" />
                                            </div>
                                            {msg.mediaType === "IMAGE" ? (
                                                <img src={msg.mediaUrl} alt="Shared media" className="max-w-full h-auto object-cover" />
                                            ) : (
                                                <video
                                                    src={msg.mediaUrl}
                                                    controls
                                                    className="max-w-full h-auto"
                                                    preload="metadata"
                                                    playsInline
                                                />
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
                <div className="bg-background border-t flex flex-col">
                    {/* Replying To Preview Banner */}
                    {replyingTo && (
                        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b text-sm">
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                <Reply className="h-4 w-4 text-primary shrink-0" />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-semibold text-xs text-primary">Replying to {replyingTo.sender.name}</span>
                                    <span className="text-muted-foreground truncate text-xs">
                                        {replyingTo.content || (replyingTo.mediaUrl ? "Attached media" : "Message")}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full shrink-0"
                                onClick={() => setReplyingTo(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <div className="p-4">
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
                                onBlur={handleInputBlur}
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
            </div>
            {/* Mobile Keyboard Spacer: This empty block rapidly expands when the input is focused, artificially lengthening the page. 
            This breaks the native browser out of its bounded document limit, allowing it to easily push the chat input
            above the newly appearing keyboard, even in rigid UIWebViews (like Facebook Messenger / Instagram) */ }
            <div className={`transition-all duration-300 md:hidden ${isInputFocused ? 'h-[50vh]' : 'h-0'}`} />
        </>
    );
};
