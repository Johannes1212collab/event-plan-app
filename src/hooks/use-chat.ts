import { useState, useRef, useEffect } from "react";
import { sendMessage, getMessages } from "@/actions/message";

export interface Message {
    id: string;
    content: string | null;
    mediaUrl: string | null;
    mediaType: string | null;
    thumbnailUrl?: string | null;
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

export function useChat({ eventId, initialMessages, currentUserId }: { eventId: string, initialMessages: Message[], currentUserId: string }) {
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

    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash) {
            const hash = window.location.hash;
            if (hash.startsWith("#msg-") || hash === "#chat") {
                setTimeout(() => {
                    const targetId = hash.startsWith("#msg-") ? hash.replace('#', '') : 'chat';
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                        if (targetId.startsWith("msg-")) {
                            targetElement.classList.add("ring-2", "ring-primary", "ring-offset-2", "transition-all", "duration-1000");
                            setTimeout(() => {
                                targetElement.classList.remove("ring-2", "ring-primary", "ring-offset-2");
                            }, 3000);
                        }

                        window.history.replaceState(null, '', window.location.pathname + window.location.search);
                    }
                }, 500);
            }
        }
    }, [allMessages.length]);

    useEffect(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

            if (isNearBottom || pendingMessages.length > 0) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [allMessages.length, pendingMessages.length]);

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
        }, 400);
    };

    const handleInputBlur = () => {
        setIsInputFocused(false);
    };

    const handleNativeDownload = async (mediaUrl: string) => {
        try {
            if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
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
        setContent("");

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

            if (res?.message) {
                setRealMessages(prev => [...prev, res.message as unknown as Message]);
            }
        } finally {
            setPendingMessages(prev => prev.filter(m => m.id !== pendingMessage.id));
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);

        try {
            const { upload } = await import('@vercel/blob/client');
            const { toast } = await import('sonner');

            let imageCompression;
            try {
                imageCompression = (await import('browser-image-compression')).default;
            } catch (e) {
                console.warn("browser-image-compression not available", e);
            }

            for (const file of Array.from(files)) {
                let fileToUpload: File | Blob = file;
                let thumbnailFileToUpload: File | Blob | null = null;
                const toastId = toast.loading(`Preparing ${file.name}...`);

                try {
                    const isImage = file.type.startsWith('image/');

                    if (isImage && imageCompression) {
                        toast.loading(`Compressing ${file.name}...`, { id: toastId });
                        fileToUpload = await imageCompression(file, {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true,
                        });

                        toast.loading(`Generating thumbnail for ${file.name}...`, { id: toastId });
                        thumbnailFileToUpload = await imageCompression(file, {
                            maxSizeMB: 0.1,
                            maxWidthOrHeight: 400,
                            useWebWorker: true,
                        });
                    }

                    toast.loading(`Uploading to server...`, { id: toastId });

                    const filenameBase = `${file.name.split('.').slice(0, -1).join('.')}-${Math.random().toString(36).substring(2, 9)}`;
                    const ext = file.name.split('.').pop();

                    const newBlob = await upload(`${filenameBase}.${ext}`, fileToUpload as File, {
                        access: 'public',
                        handleUploadUrl: '/api/upload',
                    });

                    let thumbnailBlobUrl = null;
                    if (thumbnailFileToUpload) {
                        const thumbBlob = await upload(`${filenameBase}-thumb.${ext}`, thumbnailFileToUpload as File, {
                            access: 'public',
                            handleUploadUrl: '/api/upload',
                        });
                        thumbnailBlobUrl = thumbBlob.url;
                    }

                    const pendingMessage: any = {
                        id: Math.random().toString(),
                        content: "",
                        mediaUrl: newBlob.url,
                        thumbnailUrl: thumbnailBlobUrl,
                        mediaType: isImage ? 'IMAGE' : 'VIDEO',
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
                            thumbnailUrl: thumbnailBlobUrl,
                            mediaType: isImage ? 'IMAGE' : 'VIDEO',
                            eventId
                        });

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

    return {
        content,
        setContent,
        isUploading,
        replyingTo,
        setReplyingTo,
        allMessages,
        isInputFocused,
        fileInputRef,
        scrollRef,
        inputRef,
        handleNativeDownload,
        onSubmit,
        handleUpload,
        handleInputFocus,
        handleInputBlur,
    };
}
