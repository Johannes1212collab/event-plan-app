"use client";

import { useState } from "react";
import { Download, FileImage, FileVideo, User, Check, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface MediaItem {
    id: string;
    mediaUrl: string | null;
    mediaType: string | null; // "IMAGE" | "VIDEO"
    createdAt: Date;
    sender: {
        name: string | null;
        image: string | null;
    };
}

export function MediaGallery({ initialMedia }: { initialMedia: MediaItem[] }) {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedIds.size === initialMedia.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(initialMedia.map(m => m.id)));
        }
    };

    const handleBatchDownload = async () => {
        if (selectedIds.size === 0) return;

        setIsDownloading(true);
        const toastId = toast.loading(`Preparing to download ${selectedIds.size} files...`);
        let successCount = 0;

        try {
            for (const id of selectedIds) {
                const item = initialMedia.find(m => m.id === id);
                if (item?.mediaUrl) {
                    const link = document.createElement('a');
                    link.href = `/api/download?url=${encodeURIComponent(item.mediaUrl)}`;
                    link.download = ''; // Browser handles filename from header
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Small delay to prevent browser throttling
                    await new Promise(resolve => setTimeout(resolve, 500));
                    successCount++;
                }
            }
            toast.success(`Downloaded ${successCount} files`, { id: toastId });
        } catch (error) {
            console.error("Batch download error:", error);
            toast.error("Some downloads failed", { id: toastId });
        } finally {
            setIsDownloading(false);
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        }
    };

    if (initialMedia.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Media Gallery</CardTitle>
                    <CardDescription>Photos and videos shared in the chat will appear here.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <FileImage className="h-12 w-12 mb-2 opacity-20" />
                    <p>No media shared yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col overflow-hidden" id="media-gallery">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <div
                    className="space-y-1 cursor-pointer group"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                        Media Gallery
                        {isCollapsed ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronUp className="h-5 w-5 text-muted-foreground" />}
                    </CardTitle>
                    <CardDescription>
                        {initialMedia.length} {initialMedia.length === 1 ? "file" : "files"} shared
                    </CardDescription>
                </div>
                {!isSelectionMode ? (
                    <Button variant="outline" size="sm" onClick={() => { setIsCollapsed(false); setIsSelectionMode(true); }}>
                        Select
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleBatchDownload} disabled={selectedIds.size === 0 || isDownloading}>
                            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                            Download ({selectedIds.size})
                        </Button>
                    </div>
                )}
            </CardHeader>
            {!isCollapsed && (
                <CardContent>
                    {isSelectionMode && (
                        <div className="mb-4 flex items-center justify-between">
                            <Button variant="link" size="sm" className="p-0 h-auto" onClick={toggleAll}>
                                {selectedIds.size === initialMedia.length ? "Deselect All" : "Select All"}
                            </Button>
                            <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
                        </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {initialMedia.map((item) => (
                            <div
                                key={item.id}
                                className={`group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border cursor-pointer ${isSelectionMode && selectedIds.has(item.id) ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                onClick={() => isSelectionMode && toggleSelection(item.id)}
                            >
                                {item.mediaType === "IMAGE" ? (
                                    <Image
                                        src={item.mediaUrl!}
                                        alt="Shared image"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <video
                                        src={item.mediaUrl!}
                                        className="w-full h-full object-cover"
                                    />
                                )}

                                {/* Selection Overlay */}
                                {isSelectionMode && (
                                    <div className={`absolute inset-0 bg-black/20 transition-opacity flex items-start justify-end p-2 ${selectedIds.has(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${selectedIds.has(item.id) ? 'bg-primary border-primary text-white' : 'bg-white/50 border-white'}`}>
                                            {selectedIds.has(item.id) && <Check className="h-4 w-4" />}
                                        </div>
                                    </div>
                                )}

                                {/* Default Overlay (Only when NOT in selection mode) */}
                                {!isSelectionMode && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                        <div className="text-white text-xs flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            <span className="truncate">{item.sender.name || "Unknown"}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            asChild
                                            className="w-full h-8 text-xs bg-white/90 hover:bg-white"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <a
                                                href={`/api/download?url=${encodeURIComponent(item.mediaUrl!)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Download className="h-3 w-3 mr-1" />
                                                Download
                                            </a>
                                        </Button>
                                    </div>
                                )}

                                {/* Type Icon Badge */}
                                <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-md opacity-70 group-hover:opacity-0 transition-opacity pointer-events-none">
                                    {item.mediaType === "IMAGE" ? (
                                        <FileImage className="h-3 w-3" />
                                    ) : (
                                        <FileVideo className="h-3 w-3" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
