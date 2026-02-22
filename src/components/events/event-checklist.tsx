"use client";

import { useState, useTransition } from "react";
import { createTask, toggleTask, deleteTask, assignTask, unassignTask } from "@/actions/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Trash2, CheckCircle2, Circle, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TaskAssignment {
    id: string;
    userId: string;
    user: { id: string; name: string | null; image: string | null };
}

interface EventTask {
    id: string;
    title: string;
    isCompleted: boolean;
    assignments: TaskAssignment[];
}

interface EventChecklistProps {
    eventId: string;
    initialTasks: EventTask[];
    currentUserId: string;
    isHost: boolean;
}

export function EventChecklist({ eventId, initialTasks, currentUserId, isHost }: EventChecklistProps) {
    const [tasks, setTasks] = useState<EventTask[]>(initialTasks);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const title = newTaskTitle;
        setNewTaskTitle("");

        // Optimistic UI
        const tempId = Math.random().toString();
        const newTask: EventTask = {
            id: tempId,
            title,
            isCompleted: false,
            assignments: []
        };
        setTasks((prev) => [...prev, newTask]);

        startTransition(async () => {
            const result = await createTask({ eventId, title });
            if (result.error) {
                toast.error(result.error);
                setTasks((prev) => prev.filter((t) => t.id !== tempId));
            } else if (result.task) {
                setTasks((prev) => prev.map((t) => t.id === tempId ? (result.task as unknown as EventTask) : t));
            }
        });
    };

    const handleToggleTask = (taskId: string, currentStatus: boolean) => {
        // Optimistic UI
        setTasks((prev) =>
            prev.map((t) => t.id === taskId ? { ...t, isCompleted: !currentStatus } : t)
        );

        startTransition(async () => {
            const result = await toggleTask(taskId, !currentStatus);
            if (result.error) {
                toast.error(result.error);
                // Revert
                setTasks((prev) =>
                    prev.map((t) => t.id === taskId ? { ...t, isCompleted: currentStatus } : t)
                );
            }
        });
    };

    const handleDeleteTask = (taskId: string) => {
        const previousTasks = [...tasks];

        // Optimistic UI
        setTasks((prev) => prev.filter((t) => t.id !== taskId));

        startTransition(async () => {
            const result = await deleteTask(taskId);
            if (result.error) {
                toast.error(result.error);
                setTasks(previousTasks); // Revert
            }
        });
    };

    const handleClaimTask = (taskId: string) => {
        // Optimistic claim
        setTasks((prev) =>
            prev.map((t) => {
                if (t.id === taskId) {
                    return {
                        ...t,
                        assignments: [
                            ...t.assignments,
                            { id: "temp", userId: currentUserId, user: { id: currentUserId, name: "You", image: null } }
                        ]
                    };
                }
                return t;
            })
        );

        startTransition(async () => {
            const result = await assignTask(taskId, currentUserId);
            if (result.error) {
                toast.error(result.error);
            } else if (result.assignment) {
                const asg = result.assignment;
                setTasks((prev) =>
                    prev.map((t) => {
                        if (t.id === taskId) {
                            return {
                                ...t,
                                assignments: t.assignments.filter(a => a.id !== "temp").concat(asg)
                            };
                        }
                        return t;
                    })
                );
            }
        });
    };

    const handleUnclaimTask = (taskId: string) => {
        // Optimistic unclaim
        setTasks((prev) =>
            prev.map((t) => {
                if (t.id === taskId) {
                    return { ...t, assignments: t.assignments.filter((a) => a.userId !== currentUserId) };
                }
                return t;
            })
        );

        startTransition(async () => {
            const result = await unassignTask(taskId, currentUserId);
            if (result.error) {
                toast.error(result.error);
            }
        });
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Checklist & Allocations
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleCreateTask} className="flex gap-2 mb-6">
                    <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="What do we need? (e.g. Bring cups)"
                        className="flex-1"
                        disabled={isPending}
                    />
                    <Button type="submit" disabled={!newTaskTitle.trim() || isPending}>
                        <Plus className="h-4 w-4 mr-2" /> Add
                    </Button>
                </form>

                <div className="space-y-3">
                    {tasks.length === 0 && (
                        <p className="text-sm text-muted-foreground italic text-center py-4">
                            No items needed yet. Add something to the list!
                        </p>
                    )}
                    {tasks.map((task) => {
                        const isClaimedByMe = task.assignments.some(a => a.userId === currentUserId);

                        return (
                            <div key={task.id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${task.isCompleted ? 'bg-muted/50' : 'bg-card'}`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <button
                                        onClick={() => handleToggleTask(task.id, task.isCompleted)}
                                        className="shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-1 transition-colors"
                                    >
                                        {task.isCompleted ? (
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </button>
                                    <span className={`text-sm font-medium truncate ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                        {task.title}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Assignments */}
                                    <div className="flex -space-x-2 mr-2">
                                        {task.assignments.map((assignment, i) => (
                                            <div key={assignment.id} className="relative group cursor-pointer" onClick={() => {
                                                if (assignment.userId === currentUserId) handleUnclaimTask(task.id);
                                            }}>
                                                <Avatar className="h-8 w-8 border-2 border-background shadow-sm hover:z-10 transition-transform hover:scale-110">
                                                    {assignment.user.image ? (
                                                        <AvatarImage src={assignment.user.image} alt={assignment.user.name || "User"} />
                                                    ) : (
                                                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                            {assignment.user.name?.charAt(0) || "?"}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                {/* Tooltip on hover */}
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                                    {assignment.userId === currentUserId ? "Click to unclaim" : assignment.user.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {!isClaimedByMe && !task.isCompleted && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs font-semibold"
                                            onClick={() => handleClaimTask(task.id)}
                                        >
                                            <UserPlus className="h-3 w-3 mr-1" /> Claim
                                        </Button>
                                    )}

                                    {isHost && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                            onClick={() => handleDeleteTask(task.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
