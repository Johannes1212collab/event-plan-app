"use client";

import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { toast } from "sonner";

export const ShareSiteButton = () => {
    const handleShare = async () => {
        const url = "https://www.eventhub.community";
        const shareData = {
            title: "EventHub",
            text: "Plan Events. Invite Friends. Share Memories.",
            url: url,
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(url);
                toast.success("Link copied to clipboard!");
            }
        } catch (error) {
            // User aborted share or clipboard failed
            console.log("Error sharing", error);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={handleShare} className="ml-2 flex px-2 sm:px-3">
            <Share className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Share EventHub</span>
        </Button>
    );
};
