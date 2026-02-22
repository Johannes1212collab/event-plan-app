"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Camera } from "lucide-react";
import { updateProfileImage } from "@/actions/user";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";

interface EditableAvatarProps {
    userId: string;
    initialImage: string | null;
    name: string | null;
    isOwner: boolean;
}

export function EditableAvatar({ userId, initialImage, name, isOwner }: EditableAvatarProps) {
    const [image, setImage] = useState(initialImage);
    const [isUploading, setIsUploading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic image validation
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("Image size must be less than 5MB.");
            return;
        }

        try {
            setIsUploading(true);
            const toastId = toast.loading("Uploading new profile picture...");

            // Try to compress if possible
            let fileToUpload: File | Blob = file;
            try {
                const imageCompression = (await import('browser-image-compression')).default;
                toast.loading(`Compressing image...`, { id: toastId });
                fileToUpload = await imageCompression(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                });
            } catch (err) {
                console.warn("browser-image-compression failed or unavailable, uploading original", err);
            }

            toast.loading("Saving to server...", { id: toastId });

            // Upload to Vercel Blob
            const ext = file.name.split('.').pop();
            const filename = `profile-${userId}-${Date.now()}.${ext}`;
            const newBlob = await upload(filename, fileToUpload as File, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });

            // Update Database
            startTransition(async () => {
                const result = await updateProfileImage(newBlob.url);
                if (result.error) {
                    toast.error(result.error, { id: toastId });
                } else {
                    setImage(newBlob.url);
                    toast.success(result.success, { id: toastId });
                }
            });

        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload image. Please try again.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="relative group rounded-full">
            {image ? (
                <img
                    src={image}
                    alt={name || "User"}
                    className={`h-32 w-32 rounded-full object-cover border-4 border-slate-100 shadow-sm transition-opacity ${isUploading || isPending ? 'opacity-50' : 'opacity-100'}`}
                />
            ) : (
                <div className={`h-32 w-32 rounded-full bg-slate-200 flex items-center justify-center text-4xl text-slate-500 font-bold border-4 border-slate-100 shadow-sm transition-opacity ${isUploading || isPending ? 'opacity-50' : 'opacity-100'}`}>
                    {name?.charAt(0) || "U"}
                </div>
            )}

            {(isUploading || isPending) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {isOwner && !(isUploading || isPending) && (
                <>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors border-2 border-white"
                        aria-label="Change profile picture"
                        title="Change profile picture"
                    >
                        <Camera className="h-5 w-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                    />
                </>
            )}
        </div>
    );
}
