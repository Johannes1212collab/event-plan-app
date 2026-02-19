"use client";

import { useState } from "react";
import { Download, FileImage, FileVideo, User } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

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
    if (initialMedia.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Media Gallery</CardTitle>
                    <CardDescription>Photos and videos shared in the chat will appear here.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <FileImage className="h-12 w-12 mb-2 opacity-20" />
                    <p>No media shared yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Media Gallery</CardTitle>
                <CardDescription>
                    {initialMedia.length} {initialMedia.length === 1 ? "file" : "files"} shared
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {initialMedia.map((item) => (
                        <div key={item.id} className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border">
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

                            {/* Overlay */}
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
                                >
                                    <a href={item.mediaUrl!} download target="_blank" rel="noopener noreferrer">
                                        <Download className="h-3 w-3 mr-1" />
                                        Download
                                    </a>
                                </Button>
                            </div>

                            {/* Type Icon Badge */}
                            <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-md opacity-70 group-hover:opacity-0 transition-opacity">
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
        </Card>
    );
}
