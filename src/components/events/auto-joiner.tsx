"use client";

import { useEffect } from "react";
import { joinEvent } from "@/actions/event";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AutoJoinerProps {
    eventId: string;
}

export const AutoJoiner = ({ eventId }: AutoJoinerProps) => {
    const router = useRouter();

    useEffect(() => {
        const join = async () => {
            const result = await joinEvent(eventId);
            if (result.success && result.success !== "Already joined") {
                toast.success("You have joined this event!");
                router.refresh();
            } else if (result.error) {
                // Sssh, don't annoy them if it fails silently or they are already joined (though we check that server side too)
                if (result.error !== "Unauthorized") {
                    console.error(result.error);
                }
            }
        };

        join();
    }, [eventId, router]);

    return null;
};
