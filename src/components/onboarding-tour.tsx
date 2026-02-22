"use client";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useRef } from "react";
import { completeOnboarding } from "@/actions/user";

interface OnboardingTourProps {
    hasSeenOnboarding: boolean;
    page: "dashboard" | "event" | "discover";
}

export const OnboardingTour = ({
    hasSeenOnboarding,
    page,
}: OnboardingTourProps) => {
    const driverObj = useRef<any>(null);

    useEffect(() => {
        if (page === "discover") {
            const hasSeenScannerTour = localStorage.getItem("hasSeenScannerTour");
            if (hasSeenScannerTour) return;
        } else {
            if (hasSeenOnboarding) return;
        }

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
                    if (page === "discover") {
                        localStorage.setItem("hasSeenScannerTour", "true");
                    } else {
                        completeOnboarding();
                    }
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
                        // Point to discover tab to encourage exploration
                        {
                            element: "#discover-tab",
                            popover: {
                                title: "Discover Local Events",
                                description: "Looking for something to do? Scan your area for public events to convert into private groups!",
                                side: "bottom",
                                align: "start",
                            }
                        }
                    ]
                    : page === "discover"
                        ? [
                            {
                                element: "#scanner-center",
                                popover: {
                                    title: "Search Center",
                                    description: "Start by entering a city or venue, or simply click 'Around me' to use your device GPS.",
                                    side: "bottom",
                                    align: "start",
                                },
                            },
                            {
                                element: "#scanner-radius",
                                popover: {
                                    title: "Adjust the Radius",
                                    description: "Slide to expand or shrink how far out you want to search for events (up to 100km).",
                                    side: "bottom",
                                    align: "start",
                                },
                            },
                            {
                                element: "#scanner-dates",
                                popover: {
                                    title: "Filter by Date",
                                    description: "Looking for plans tonight? Hit 'Today Only', or enter a custom weekend date range.",
                                    side: "top",
                                    align: "start",
                                },
                            },
                            {
                                element: "#scanner-find",
                                popover: {
                                    title: "Scan Databases",
                                    description: "Click here to aggregate public events from Google and other providers. Once found, you can convert them directly into private EventHub groups!",
                                    side: "top",
                                    align: "start",
                                },
                            }
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
                                element: "#event-checklist",
                                popover: {
                                    title: "Shared To-Do List",
                                    description: "Who is bringing what? Add items to the checklist here so friends can claim responsibility for them.",
                                    side: "bottom",
                                    align: "start",
                                }
                            },
                            {
                                element: "#event-polls",
                                popover: {
                                    title: "Activity Suggestions",
                                    description: "Not sure where to eat? Create a poll and let the group vote on the best options.",
                                    side: "top",
                                    align: "start",
                                }
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
