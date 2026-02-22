"use client";

import { useState, useTransition } from "react";
import { createPoll, votePoll, deletePollVote, deletePoll } from "@/actions/poll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Trash2, PieChart, PlusCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserVote {
    id: string;
    userId: string;
    createdAt: Date;
    user: { id: string; name: string | null; image: string | null };
}

interface PollOption {
    id: string;
    text: string;
    votes: UserVote[];
}

interface EventPoll {
    id: string;
    question: string;
    isMultipleChoice: boolean;
    createdAt: Date;
    options: PollOption[];
}

interface EventPollsProps {
    eventId: string;
    initialPolls: EventPoll[];
    currentUserId: string;
    isHost: boolean;
}

export function EventPolls({ eventId, initialPolls, currentUserId, isHost }: EventPollsProps) {
    const [polls, setPolls] = useState<EventPoll[]>(initialPolls);
    const [isPending, startTransition] = useTransition();

    // Create Poll State
    const [isCreating, setIsCreating] = useState(false);
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [isMultipleChoice, setIsMultipleChoice] = useState(false);

    const handleAddOption = () => setOptions([...options, ""]);
    const handleRemoveOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleCreatePoll = async (e: React.FormEvent) => {
        e.preventDefault();
        const validOptions = options.map(o => o.trim()).filter(Boolean);
        if (!question.trim() || validOptions.length < 2) {
            toast.error("Enter a question and at least 2 options");
            return;
        }

        const tempId = Math.random().toString();
        const newPoll: EventPoll = {
            id: tempId,
            question,
            isMultipleChoice,
            createdAt: new Date(),
            options: validOptions.map((text, i) => ({
                id: `temp-opt-${i}`,
                text,
                votes: []
            }))
        };

        // Optimistic UI
        setPolls([newPoll, ...polls]);
        setIsCreating(false);
        setQuestion("");
        setOptions(["", ""]);

        startTransition(async () => {
            const result = await createPoll({ eventId, question, isMultipleChoice, options: validOptions });
            if (result.error) {
                toast.error(result.error);
                setPolls(prev => prev.filter(p => p.id !== tempId));
            } else if (result.poll) {
                setPolls(prev => prev.map(p => p.id === tempId ? (result.poll as unknown as EventPoll) : p));
            }
        });
    };

    const handleVote = (pollId: string, optionId: string, hasVotedForThis: boolean) => {
        const poll = polls.find(p => p.id === pollId);
        if (!poll) return;

        // Optimistic Update
        const previousPolls = [...polls];
        setPolls(prev => prev.map(p => {
            if (p.id !== pollId) return p;

            let newOptions = [...p.options];

            if (hasVotedForThis) {
                // Removing vote
                newOptions = newOptions.map(opt => {
                    if (opt.id === optionId) {
                        return { ...opt, votes: opt.votes.filter(v => v.userId !== currentUserId) };
                    }
                    return opt;
                });
            } else {
                // Adding vote
                if (!p.isMultipleChoice) {
                    // Remove all previous votes by this user in this poll
                    newOptions = newOptions.map(opt => ({
                        ...opt,
                        votes: opt.votes.filter(v => v.userId !== currentUserId)
                    }));
                }

                // Add new vote to the chosen option
                newOptions = newOptions.map(opt => {
                    if (opt.id === optionId) {
                        return {
                            ...opt,
                            votes: [
                                ...opt.votes,
                                { id: "temp-vote", userId: currentUserId, createdAt: new Date(), user: { id: currentUserId, name: "You", image: null } }
                            ]
                        };
                    }
                    return opt;
                });
            }

            return { ...p, options: newOptions };
        }));

        startTransition(async () => {
            if (hasVotedForThis) {
                const result = await deletePollVote(optionId);
                if (result.error) {
                    toast.error(result.error);
                    setPolls(previousPolls);
                }
            } else {
                const result = await votePoll(pollId, optionId);
                if (result.error) {
                    toast.error(result.error);
                    setPolls(previousPolls);
                }
            }
        });
    };

    const handleDeletePoll = (pollId: string) => {
        const previousPolls = [...polls];
        setPolls(prev => prev.filter(p => p.id !== pollId));

        startTransition(async () => {
            const result = await deletePoll(pollId);
            if (result.error) {
                toast.error(result.error);
                setPolls(previousPolls);
            }
        });
    };

    return (
        <Card className="w-full" id="event-polls">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" /> Activity Polls
                </CardTitle>
                {!isCreating && (
                    <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
                        <Plus className="h-4 w-4 mr-2" /> New Poll
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isCreating && (
                    <div className="mb-6 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                        <h4 className="font-semibold mb-4">Create a New Poll</h4>
                        <form onSubmit={handleCreatePoll} className="space-y-4">
                            <div>
                                <Input
                                    placeholder="Ask a question... (e.g., Where should we eat?)"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                {options.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Input
                                            placeholder={`Option ${i + 1}`}
                                            value={opt}
                                            onChange={(e) => handleOptionChange(i, e.target.value)}
                                            disabled={isPending}
                                        />
                                        {options.length > 2 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOption(i)} disabled={isPending}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button type="button" variant="ghost" size="sm" onClick={handleAddOption} disabled={isPending} className="mt-2 text-muted-foreground">
                                    <PlusCircle className="h-4 w-4 mr-2" /> Add Option
                                </Button>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isMultipleChoice}
                                        onChange={(e) => setIsMultipleChoice(e.target.checked)}
                                        disabled={isPending}
                                        className="rounded border-gray-300"
                                    />
                                    Allow multiple answers
                                </label>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)} disabled={isPending}>Cancel</Button>
                                    <Button type="submit" size="sm" disabled={isPending}>Publish Poll</Button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                <div className="space-y-6">
                    {polls.length === 0 && !isCreating && (
                        <p className="text-sm text-muted-foreground text-center py-6 italic">
                            No polls created yet. Be the first to ask the group!
                        </p>
                    )}

                    {polls.map(poll => {
                        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

                        return (
                            <div key={poll.id} className="p-4 border rounded-xl relative bg-card shadow-sm">
                                {isHost && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={() => handleDeletePoll(poll.id)}
                                        disabled={isPending}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                <h4 className="font-semibold text-lg mb-1 pr-8">{poll.question}</h4>
                                <p className="text-xs text-muted-foreground mb-4">
                                    {totalVotes} vote{totalVotes !== 1 ? 's' : ''} • {poll.isMultipleChoice ? "Multiple choices allowed" : "Single choice only"}
                                </p>

                                <div className="space-y-3">
                                    {poll.options.map(opt => {
                                        const voteCount = opt.votes.length;
                                        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                                        const hasVotedForThis = opt.votes.some(v => v.userId === currentUserId);

                                        return (
                                            <div key={opt.id} className="relative group overflow-visible">
                                                <button
                                                    onClick={() => handleVote(poll.id, opt.id, hasVotedForThis)}
                                                    disabled={isPending}
                                                    className={`w-full text-left p-3 rounded-lg border transition-all ${hasVotedForThis ? 'border-cyan-500 bg-cyan-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                                >
                                                    <div className="flex justify-between items-center mb-2 relative z-10">
                                                        <span className={`font-medium ${hasVotedForThis ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.text}</span>
                                                        <span className="text-sm font-semibold">{percentage}%</span>
                                                    </div>

                                                    <div className="relative">
                                                        <Progress value={percentage} className="h-2" />
                                                    </div>
                                                </button>

                                                {/* Tooltip Avatars of Voters */}
                                                {voteCount > 0 && (
                                                    <div className="absolute top-1/2 right-14 -translate-y-1/2 flex -space-x-2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                                        {opt.votes.slice(0, 3).map((v, i) => (
                                                            <Avatar key={i} className="h-6 w-6 border-2 border-background shadow-sm">
                                                                {v.user.image ? (
                                                                    <AvatarImage src={v.user.image} alt={v.user.name || "User"} />
                                                                ) : (
                                                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                                        {v.user.name?.charAt(0) || "?"}
                                                                    </AvatarFallback>
                                                                )}
                                                            </Avatar>
                                                        ))}
                                                        {voteCount > 3 && (
                                                            <div className="h-6 w-6 rounded-full bg-slate-200 border-2 border-background flex items-center justify-center text-[10px] text-slate-600 font-medium">
                                                                +{voteCount - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
