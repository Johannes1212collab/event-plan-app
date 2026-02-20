"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useRef } from "react";
import { completeOnboarding } from "@/actions/user";

interface OnboardingTourProps {
    hasSeenOnboarding: boolean;
    page: "dashboard" | "event";
}

export const OnboardingTour = ({
    hasSeenOnboarding,
    page,
}: OnboardingTourProps) => {
    const driverObj = useRef<any>(null);

    useEffect(() => {
        if (hasSeenOnboarding) return;

        // Initialize driver
        driverObj.current = driver({
            showProgress: true,
            animate: true,
            doneBtnText: "Done", // Text on the final button
            nextBtnText: "Next", // Text on the next button
            prevBtnText: "Previous", // Text on the previous button
            allowClose: true, // Whether clicking on overlay should close or not
            onDestroyStarted: () => {
                if (!driverObj.current.hasNextStep() || confirm("Skip the intro?")) {
                    driverObj.current.destroy();
                    // Mark as seen when destroy (skip or finish)
                    completeOnboarding();
                }
            },
            steps:
                page === "dashboard"
                    ? [
                        {
                            element: "#new-event-btn",
                            popover: {
                                title: "Create Your First Event",
                                description:
                                    "Click here to start planning! You can set a date, location, and invite friends.",
                                side: "bottom",
                                align: "start",
                            },
                        },
                    ]
                    : [
                        {
                            element: "#event-title-card",
                            popover: {
                                title: "Event Details",
                                description: "Here you can see the main info about the event.",
                                side: "bottom",
                                align: "start",
                            },
                        },
                        {
                            element: "#chat-paperclip",
                            popover: {
                                title: "Share Photos & Videos",
                                description:
                                    "Click the paperclip to upload media to the gallery. Everyone can contribute!",
                                side: "top",
                                align: "start",
                            },
                        },
                        {
                            element: "#event-actions",
                            popover: {
                                title: "Share & Manage",
                                description: "Invite friends via email, get a QR code, or add to your calendar from here.",
                                side: "bottom",
                                align: "end"
                            }
                        },
                        {
                            element: "#media-gallery",
                            popover: {
                                title: "Media Gallery",
                                description:
                                    "All shared photos and videos will appear here. Click 'Select' to download them.",
                                side: "top",
                                align: "start",
                            },
                        },
                        {
                            element: "#delete-event-btn",
                            popover: {
                                title: "Delete Event",
                                description:
                                    "Need to cancel? You can delete the event here (only if you are the host).",
                                side: "top",
                                align: "end",
                            },
                        },
                    ],
        });

        // Start the tour
        // Small delay to ensure elements are mounted
        const timer = setTimeout(() => {
            driverObj.current.drive();
        }, 1000);

        return () => clearTimeout(timer);
    }, [hasSeenOnboarding, page]);

    return null; // This component doesn't render anything visible
};
