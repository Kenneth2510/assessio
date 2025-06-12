import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

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
    updated_at: string;
};

type ViewQuizProps = {
    quiz: Quiz;
    hasTaken: boolean;
    attemptId?: number;
};

export default function ViewQuiz({ quiz }: ViewQuizProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Dashboard', href: '/admin/dashboard' },
        { title: 'Quiz Management', href: '/quiz-management' },
        { title: 'View Quiz', href: `/quiz-management/${quiz.id}` },
    ];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = (val: number) => String(val).padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="View Quiz" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl bg-blue-50 p-6 shadow-md dark:bg-muted">
                {/* Back Button */}
                <div>
                    <Button asChild className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200" variant="outline">
                        <Link href={route('quiz-management.index')}>Back</Link>
                    </Button>
                </div>

                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-3xl font-bold text-blue-800 dark:text-white">{quiz.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        by <span className="font-medium">{quiz.creator.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Last updated: {formatDate(quiz.updated_at)}</p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left - Quiz Details */}
                    <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:bg-muted">
                        <h2 className="text-xl font-semibold text-blue-700">Quiz Details</h2>
                        <Separator className="my-3" />
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span>Total Score</span>
                                <span className="font-medium">{quiz.total_score} pts</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span>Total Time</span>
                                <span className="font-medium">{formatTime(quiz.total_time)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span>Mode</span>
                                <span className="font-medium capitalize">{quiz.mode}</span>
                            </div>
                            <div className="pt-4">
                                <span className="font-medium text-muted-foreground">Description:</span>
                                <p className="mt-1 text-sm">{quiz.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right - Action Buttons */}
                    <div className="flex flex-col justify-between gap-6 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:bg-muted">
                        <div className="flex flex-col gap-4">
                            <Button className="w-full bg-blue-500 text-sm text-white hover:bg-blue-600" asChild>
                                <Link href={route('quiz-question-management.index') + `?quiz_id=${quiz.id}`}>
                                    Enter Quiz Builder
                                </Link>
                            </Button>

                            <Button className="w-full bg-blue-500 text-sm text-white hover:bg-blue-600" asChild>
                                <Link href={route('quiz-management.index')}>Enter Quiz Analytics</Link>
                            </Button>

                            <Button className="w-full bg-blue-100 text-sm text-blue-800 hover:bg-blue-200" variant="outline" asChild>
                                <Link href="/quiz-management">Back to Quizzes</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
