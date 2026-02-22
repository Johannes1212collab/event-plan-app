import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Paperclip, X, Reply } from "lucide-react";
import { Message } from "@/hooks/use-chat";

interface ChatInputProps {
    content: string;
    setContent: (content: string) => void;
    isUploading: boolean;
    replyingTo: Message | null;
    setReplyingTo: (msg: Message | null) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onSubmit: (e: React.FormEvent) => void;
    handleUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleInputFocus: () => void;
    handleInputBlur: () => void;
    isInputFocused: boolean;
}

export function ChatInput({
    content,
    setContent,
    isUploading,
    replyingTo,
    setReplyingTo,
    fileInputRef,
    inputRef,
    onSubmit,
    handleUpload,
    handleInputFocus,
    handleInputBlur,
    isInputFocused
}: ChatInputProps) {
    return (
        <>
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

            {/* Mobile Keyboard Spacer */}
            <div className={`transition-all duration-300 md:hidden ${isInputFocused ? 'h-[50vh]' : 'h-0'}`} />
        </>
    );
}
