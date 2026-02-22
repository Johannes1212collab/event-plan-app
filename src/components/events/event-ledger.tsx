"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Receipt, ArrowRight, Trash2 } from "lucide-react";
import { createExpense, deleteExpense, getLedgerSummary } from "@/actions/ledger";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface EventLedgerProps {
    eventId: string;
    currentUserId: string;
    participants: { id: string; user: { id: string; name: string } }[];
}

export const EventLedger = ({ eventId, currentUserId, participants }: EventLedgerProps) => {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [debts, setDebts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        loadLedger();
    }, [eventId]);

    const loadLedger = async () => {
        const result = await getLedgerSummary(eventId);
        if (result.error) {
            toast.error(result.error);
        } else {
            setExpenses(result.expenses || []);
            setDebts(result.debts || []);
        }
        setIsLoading(false);
    };

    const handleAddExpense = () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }

        if (!description.trim()) {
            toast.error("Please enter a description.");
            return;
        }

        // Default: Split with ALL participants (including self)
        const allUserIds = participants.map(p => p.user.id);

        startTransition(async () => {
            const result = await createExpense({
                eventId,
                amount: numAmount,
                description,
                splitBetweenUserIds: allUserIds
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Expense added successfully!");
                setAmount("");
                setDescription("");
                loadLedger(); // Refresh graph
            }
        });
    };

    const handleDeleteExpense = (expenseId: string) => {
        startTransition(async () => {
            const result = await deleteExpense(expenseId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Expense deleted.");
                loadLedger(); // Refresh graph
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Balances / Debts Summary */}
            <Card className="border-emerald-100 bg-emerald-50/30">
                <CardContent className="p-6">
                    <h3 className="font-semibold text-lg flex items-center mb-4">
                        <Receipt className="h-5 w-5 mr-2 text-emerald-600" />
                        Simplified Debts
                    </h3>

                    {debts.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">Everyone is settled up! Try adding an expense below.</p>
                    ) : (
                        <div className="space-y-3">
                            {debts.map((debt, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium ${debt.from.id === currentUserId ? 'text-red-600' : 'text-slate-700'}`}>
                                            {debt.from.id === currentUserId ? 'You' : debt.from.name}
                                        </span>
                                        <span className="text-slate-400 text-xs">owes</span>
                                        <span className={`font-medium ${debt.to.id === currentUserId ? 'text-emerald-600' : 'text-slate-700'}`}>
                                            {debt.to.id === currentUserId ? 'You' : debt.to.name}
                                        </span>
                                    </div>
                                    <div className="font-bold text-lg text-slate-900 mt-2 sm:mt-0">
                                        ${debt.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Action & History List Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Add Expense Form */}
                <Card className="h-fit">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Add Expense</h3>

                        <div className="space-y-2">
                            <Label htmlFor="description">What was it for?</Label>
                            <Input
                                id="description"
                                placeholder="e.g. Gas, Groceries, Tickets"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Total Amount ($)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleAddExpense}
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Split with Everyone
                        </Button>
                    </CardContent>
                </Card>

                {/* Expenses History */}
                <Card>
                    <CardContent className="p-0">
                        <div className="p-4 border-b bg-slate-50 rounded-t-lg">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">History</h3>
                        </div>
                        <ScrollArea className="h-[300px]">
                            {expenses.length === 0 ? (
                                <div className="p-8 text-center text-sm text-slate-500">No expenses recorded yet.</div>
                            ) : (
                                <div className="p-4 space-y-4">
                                    {expenses.map((expense) => (
                                        <div key={expense.id} className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-slate-900">{expense.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500">Paid by {expense.paidById === currentUserId ? 'You' : expense.paidBy.name}</span>
                                                    <span className="text-xs text-slate-400">&bull;</span>
                                                    <span className="text-xs text-slate-400">{new Date(expense.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="font-bold text-slate-900">${expense.amount.toFixed(2)}</span>
                                                {(expense.paidById === currentUserId) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};
