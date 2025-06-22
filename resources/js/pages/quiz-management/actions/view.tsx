import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Tag } from 'lucide-react';

export type User = {
    id: string;
    name: string;
    email: string;
};

export type SkillTag = {
    id: number;
    tag_title: string;
    description: string;
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
    skill_tags: SkillTag[];
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
                    <div className="space-y-6">
                        {/* Quiz Info Card */}
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

                        {/* Skill Tags Card */}
                        <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:bg-muted">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag className="h-5 w-5 text-blue-700" />
                                <h2 className="text-xl font-semibold text-blue-700">Skill Tags</h2>
                            </div>
                            <Separator className="my-3" />

                            {quiz.skill_tags && quiz.skill_tags.length > 0 ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        This quiz assesses the following skills:
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {quiz.skill_tags.map((tag) => (
                                            <div
                                                key={tag.id}
                                                className="flex flex-col gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3"
                                            >
                                                <Badge
                                                    variant="secondary"
                                                    className="w-fit bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                >
                                                    {tag.tag_title}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground">
                                                    {tag.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Tag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        No skill tags assigned to this quiz
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Add skill tags to help categorize what skills this quiz assesses
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right - Action Buttons */}
                    <div className="flex flex-col justify-start gap-6">
                        <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm dark:bg-muted">
                            <h2 className="text-xl font-semibold text-blue-700 mb-4">Actions</h2>
                            <div className="flex flex-col gap-4">
                                <Button className="w-full bg-blue-500 text-sm text-white hover:bg-blue-600" asChild>
                                    <Link href={route('quiz-question-management.index') + `?quiz_id=${quiz.id}`}>
                                        Enter Quiz Builder
                                    </Link>
                                </Button>

                                <Button className="w-full bg-blue-500 text-sm text-white hover:bg-blue-600" asChild>
                                    <Link href={route('quiz.analytics', quiz.id)}>Enter Quiz Analytics</Link>
                                </Button>

                                <Button className="w-full bg-amber-500 text-sm text-white hover:bg-amber-600" asChild>
                                    <Link href={route('quiz-management.edit', quiz.id)}>Edit Quiz</Link>
                                </Button>

                                <Button className="w-full bg-blue-100 text-sm text-blue-800 hover:bg-blue-200" variant="outline" asChild>
                                    <Link href="/quiz-management">Back to Quizzes</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
