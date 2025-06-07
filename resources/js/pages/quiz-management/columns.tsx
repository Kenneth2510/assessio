'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, UserCog } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@inertiajs/react';
import DeleteQuiz from './actions/delete';

export type User = {
    id: string;
    name: string;
    email: string;
};

export type Quiz = {
    id: string;
    title: string;
    description: string;
    mode: string;
    creator: User;
    total_score: number;
    total_time: number;
};

export const columns: ColumnDef<Quiz>[] = [
    {
        accessorKey: 'id',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const id = row.original.id;
            return <div className="ml-3 font-semibold">{id}</div>;
        },
    },
    {
        accessorKey: 'title',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Title
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const title = row.original.title;
            const description = row.original.description;
            return (
                <div>
                    <div className="font-semibold">{title}</div>
                    <div className="text-xs font-light text-gray-600">{description}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'creator',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Creator
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const creator = row.original.creator;
            return <div>{creator.name}</div>;
        },
    },
    {
        accessorKey: 'mode',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Mode
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const mode = row.original.mode;
            return (
                <div>
                    <Badge variant={mode === 'standard' ? 'default' : 'destructive'}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Badge>
                </div>
            );
        },
    },
    {
        accessorKey: 'total_score|total_time',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Score
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const score = row.original.total_score;
            const time = row.original.total_time;

            const formatTime = (totalSeconds: number): string => {
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                const pad = (num: number) => String(num).padStart(2, '0');
                return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
            };
            return (
                <div>
                    <div className="font-semibold">{score} points</div>
                    <div className="text-xs font-light text-gray-600">{formatTime(time)}</div>
                </div>
            );
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const quiz = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Actions</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={route('quiz-management.edit', quiz.id)} className="flex">
                                <UserCog />
                                <span className="mx-3">Edit</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <DeleteQuiz quiz={quiz} />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
