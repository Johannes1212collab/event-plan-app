import { Button } from "@/components/ui/button";
import { Download, Check, CheckCheck, Reply } from "lucide-react";
import { Message } from "@/hooks/use-chat";

interface ChatMessageListProps {
    messages: Message[];
    currentUserId: string;
    setReplyingTo: (msg: Message) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    handleNativeDownload: (url: string) => void;
}

export function ChatMessageList({
    messages,
    currentUserId,
    setReplyingTo,
    inputRef,
    scrollRef,
    handleNativeDownload
}: ChatMessageListProps) {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950" ref={scrollRef}>
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground mt-10">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            )}
            {messages.map((msg) => {
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

                            {/* Media Display Component */}
                            {(() => {
                                const rawMsg = msg as any;
                                const displayUrl = rawMsg.mediaUrl || rawMsg.thumbnailUrl;

                                if (!displayUrl) return null;

                                return (
                                    <div
                                        className="mb-2 rounded overflow-hidden cursor-pointer relative group bg-black/5 flex flex-col items-center"
                                        onClick={() => rawMsg.mediaUrl ? handleNativeDownload(rawMsg.mediaUrl) : null}
                                    >
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                                            {rawMsg.mediaUrl ? (
                                                <Download className="text-white h-6 w-6 drop-shadow-md" />
                                            ) : (
                                                <span className="text-white text-xs font-semibold px-2 py-1 bg-black/60 rounded">Archived</span>
                                            )}
                                        </div>

                                        {msg.mediaType === "IMAGE" ? (
                                            <img
                                                src={displayUrl}
                                                alt="Shared media"
                                                className={`max-w-full h-auto object-cover ${!rawMsg.mediaUrl && rawMsg.thumbnailUrl ? "blur-[1px] opacity-80" : ""}`}
                                            />
                                        ) : (
                                            <video
                                                src={displayUrl}
                                                controls
                                                className="max-w-full h-auto"
                                                preload="metadata"
                                                playsInline
                                            />
                                        )}

                                        {!rawMsg.mediaUrl && rawMsg.thumbnailUrl && (
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-max">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-7 text-[10px] shadow-sm bg-white/90 hover:bg-white text-black"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            const { toast } = await import('sonner');
                                                            const { requestImage } = await import('@/actions/image-request');
                                                            const res = await requestImage(msg.id);

                                                            if (res.error) {
                                                                toast.error(res.error);
                                                            } else {
                                                                toast.success(res.success);
                                                            }
                                                        } catch (err) {
                                                            console.error(err);
                                                        }
                                                    }}
                                                >
                                                    Request Original
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

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
    );
}
