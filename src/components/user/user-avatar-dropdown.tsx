"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { User as UserIcon, UserPlus, UserMinus, ExternalLink, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleFollow } from "@/actions/follow";
import { toast } from "sonner";

interface UserAvatarDropdownProps {
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
    currentUserId?: string;
    initialIsFollowing?: boolean;
    className?: string;
}

export function UserAvatarDropdown({
    user,
    currentUserId,
    initialIsFollowing = false,
    className = "h-8 w-8 cursor-pointer"
}: UserAvatarDropdownProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isPending, startTransition] = useTransition();

    const isSelf = currentUserId === user.id;

    const handleToggleFollow = () => {
        if (!currentUserId) {
            toast.error("You must be logged in to follow users.");
            return;
        }

        startTransition(async () => {
            const result = await toggleFollow(user.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.success);
                // Optimistically update or trust server response
                setIsFollowing(result.isFollowing ?? !isFollowing);
            }
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="relative inline-block hover:opacity-80 transition-opacity">
                    <Avatar className={className}>
                        {user.image ? (
                            <AvatarImage src={user.image} alt={user.name || "User"} />
                        ) : (
                            <AvatarFallback>
                                <UserIcon className="h-4 w-4" />
                            </AvatarFallback>
                        )}
                    </Avatar>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">{user.name || 'Anonymous User'}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link href={`/user/${user.id}`} className="flex items-center cursor-pointer w-full">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        <span>Visit Profile</span>
                    </Link>
                </DropdownMenuItem>

                {!isSelf && currentUserId && (
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.preventDefault(); // Keep dropdown open or handle state gracefully
                            handleToggleFollow();
                        }}
                        className="cursor-pointer"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : isFollowing ? (
                            <UserMinus className="mr-2 h-4 w-4 text-red-500" />
                        ) : (
                            <UserPlus className="mr-2 h-4 w-4 text-primary" />
                        )}
                        <span>{isFollowing ? "Unfollow" : "Follow"}</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
