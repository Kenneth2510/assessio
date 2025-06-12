import MySwal from '@/components/swal-alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import QuizQuestionCard from './QuizQuestionCard';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Quiz Management', href: '/quiz-management' },
];

interface QuizQuestion {
    id: number | string;
    question: string;
    question_type: 'multiple_choice' | 'identification' | 'checkbox';
    score: number;
    isRequired: boolean;
    time?: number;
    choices?: { choice: string; isCorrect: boolean }[];
    correctAnswer?: string;
    isNew?: boolean;
}

interface Props {
    quiz_id: number;
    quiz_questions: QuizQuestion[];
}

export default function QuizQuestionIndex({ quiz_id, quiz_questions }: Props) {
    const [questions, setQuestions] = useState<QuizQuestion[]>(quiz_questions ?? []);
    const [isSavingAll, setIsSavingAll] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const addNewQuestion = () => {
        const newQuestionId = uuidv4();
        const newQuestion: QuizQuestion = {
            id: newQuestionId,
            question: '',
            question_type: 'multiple_choice',
            score: 1,
            isRequired: false,
            time: 60,
            choices: [{ choice: '', isCorrect: false }],
            correctAnswer: '',
            isNew: true,
        };

        setQuestions((prev) => [...prev, newQuestion]);

        // Focus on the newly added question after state update
        setTimeout(() => {
            const newQuestionElement = questionRefs.current[newQuestionId];
            if (newQuestionElement) {
                newQuestionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });

                // Focus on the question input field
                const questionInput = newQuestionElement.querySelector('input[placeholder*="question"]') as HTMLInputElement;
                if (questionInput) {
                    questionInput.focus();
                }
            }
        }, 100);
    };

    const handleUpdate = useCallback(
        async (id: number | string, data: Partial<QuizQuestion>): Promise<void> => {
            // Find the current question to determine if it's new
            const currentQuestion = questions.find((q) => q.id === id);
            const isNew = typeof id === 'string' || currentQuestion?.isNew;

            const payload = {
                quiz_id,
                ...data,
            };

            return new Promise<void>((resolve, reject) => {
                if (isNew) {
                    router.post(route('quiz-question-management.store'), payload, {
                        onSuccess: (page: any) => {
                            console.log('New question saved');
                            // Update the question with the new ID from server
                            if (page.props?.newQuestionId) {
                                setQuestions((prev) =>
                                    prev.map((q) => (q.id === id ? { ...q, ...data, id: page.props.newQuestionId, isNew: false } : q)),
                                );
                            }
                            resolve();
                        },
                        onError: (errors) => {
                            console.error('Failed to create question:', errors);
                            reject(errors);
                        },
                    });
                } else {
                    router.put(route('quiz-question-management.update', id), payload, {
                        onSuccess: () => {
                            console.log(`Question ${id} updated`);
                            // Update local state
                            setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...data } : q)));
                            resolve();
                        },
                        onError: (errors) => {
                            console.error(`Failed to update question ${id}:`, errors);
                            reject(errors);
                        },
                    });
                }
            });
        },
        [questions, quiz_id],
    );

    const handleSaveAll = async () => {
        setIsSavingAll(true);

        try {
            // Get all question cards with unsaved changes
            const savePromises: Promise<void>[] = [];

            // Trigger save on all question cards
            questions.forEach((question) => {
                const questionElement = questionRefs.current[question.id];
                if (questionElement) {
                    const saveButton = questionElement.querySelector('[data-save-button]') as HTMLButtonElement;
                    if (saveButton && !saveButton.disabled) {
                        // Trigger click on save button to use existing save logic
                        saveButton.click();
                    }
                }
            });

            // Wait a moment for all saves to process
            await new Promise((resolve) => setTimeout(resolve, 2000));

            MySwal.fire({
                icon: 'success',
                title: 'All Saved!',
                text: 'All questions have been saved successfully.',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Save all failed:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Some questions failed to save. Please try again.',
            });
        } finally {
            setIsSavingAll(false);
        }
    };

    const handleDelete = async (id: number | string) => {
        const isNew = typeof id === 'string';

        if (isNew) {
            // For new questions, just remove from local state
            setQuestions((prev) => prev.filter((q) => q.id !== id));
            return;
        }

        // Show confirmation dialog for existing questions
        const confirm = await MySwal.fire({
            title: 'Delete Question?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc3545',
        });

        if (!confirm.isConfirmed) return;

        router.delete(route('quiz-question-management.destroy', { id }), {
            onSuccess: () => {
                console.log(`Deleted question ${id} successfully`);
                setQuestions((prev) => prev.filter((q) => q.id !== id));
                MySwal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Question has been deleted.',
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
            onError: (errors) => {
                console.error('Delete failed:', errors);
                MySwal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to delete question. Please try again.',
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Quiz Builder" />

            <div className="flex h-full w-full flex-col gap-4 p-4 md:flex-row">
                {/* Enhanced Sidebar */}
                <div className="sticky top-4 w-full md:w-1/4">
                    <div>
                        <Button asChild>
                            <Link href={route('quiz-management.show', quiz_id)} className="flex">
                                <span className="mx-3">← Back to Quiz</span>
                            </Link>
                        </Button>
                    </div>

                    <div className="mt-3 space-y-4">
                        {/* Quiz Overview Card */}
                        <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
                            <h2 className="mb-3 flex items-center text-lg font-semibold text-blue-800">
                                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                Quiz Overview
                            </h2>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between rounded bg-white/60 p-2">
                                    <span className="font-medium text-gray-700">Total Questions</span>
                                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">{questions.length}</span>
                                </div>

                                <div className="flex items-center justify-between rounded bg-white/60 p-2">
                                    <span className="font-medium text-gray-700">Total Score</span>
                                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
                                        {questions.reduce((sum, q) => sum + (q.score || 0), 0)} pts
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded bg-white/60 p-2">
                                    <span className="font-medium text-gray-700">Est. Duration</span>
                                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-800">
                                        {Math.ceil(questions.reduce((sum, q) => sum + (q.time || 0), 0) / 60)} min
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded bg-white/60 p-2">
                                    <span className="font-medium text-gray-700">Unsaved Changes</span>
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                                            questions.some((q) => q.isNew) ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {questions.filter((q) => q.isNew).length || 'None'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Question Types Summary */}
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <h3 className="mb-3 flex items-center text-base font-semibold text-gray-800">
                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                                Question Types
                            </h3>

                            <div className="space-y-1">
                                {['multiple_choice', 'identification', 'checkbox'].map((type) => {
                                    const count = questions.filter((q) => q.question_type === type).length;
                                    const percentage = questions.length > 0 ? Math.round((count / questions.length) * 100) : 0;
                                    const colors = {
                                        multiple_choice: 'bg-blue-500',
                                        identification: 'bg-green-500',
                                        checkbox: 'bg-purple-500',
                                    };

                                    return (
                                        <div key={type} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                                                <span className="text-gray-600">
                                                    {count} ({percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                                                <div
                                                    className={`h-full transition-all duration-300 ${colors[type as keyof typeof colors]}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <h3 className="mb-3 flex items-center text-base font-semibold text-gray-800">
                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                Questions ({questions.length})
                            </h3>

                            <ScrollArea className="h-60 rounded-md border">
                                <div className="space-y-2 p-3">
                                    {questions.length === 0 ? (
                                        <div className="py-8 text-center text-gray-500">
                                            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                            <p className="mt-2 text-sm">No questions yet</p>
                                            <p className="text-xs text-gray-400">Click "Add Question" to start</p>
                                        </div>
                                    ) : (
                                        questions.map((q, i) => {
                                            const typeIcons = {
                                                multiple_choice: '●',
                                                identification: '✏️',
                                                checkbox: '☑️',
                                            };

                                            const typeColors = {
                                                multiple_choice: 'text-blue-600 bg-blue-50',
                                                identification: 'text-green-600 bg-green-50',
                                                checkbox: 'text-purple-600 bg-purple-50',
                                            };

                                            return (
                                                <div
                                                    key={q.id}
                                                    className="group cursor-pointer rounded-lg border border-gray-200 p-3 transition-all hover:border-blue-300 hover:bg-blue-50/50"
                                                    onClick={() => {
                                                        const element = questionRefs.current[q.id];
                                                        if (element) {
                                                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="mb-1 flex items-center gap-2">
                                                                <span className="text-xs font-bold text-gray-500">Q{i + 1}</span>
                                                                <span
                                                                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${typeColors[q.question_type as keyof typeof typeColors]}`}
                                                                >
                                                                    {typeIcons[q.question_type]} {q.question_type.replace('_', ' ')}
                                                                </span>
                                                                {q.isNew && (
                                                                    <span className="inline-flex items-center rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800">
                                                                        New
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="truncate text-sm font-medium text-gray-900 group-hover:text-blue-700">
                                                                {q.question || 'Untitled question'}
                                                            </p>
                                                            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                                                                <span>{q.score || 0} pts</span>
                                                                <span>•</span>
                                                                <span>{q.time || 0}s</span>
                                                                {q.isRequired && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="text-red-600">Required</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            <Button onClick={addNewQuestion} className="w-full bg-blue-600 shadow-sm hover:bg-blue-700">
                                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Question
                            </Button>

                            <Button
                                onClick={handleSaveAll}
                                disabled={isSavingAll || questions.length === 0}
                                className="w-full bg-green-600 shadow-sm hover:bg-green-700"
                            >
                                {isSavingAll ? (
                                    <>
                                        <svg className="mr-2 h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Saving All...
                                    </>
                                ) : (
                                    <>
                                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                            />
                                        </svg>
                                        Save All Questions
                                    </>
                                )}
                            </Button>

                            {questions.filter((q) => q.isNew).length > 0 && (
                                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                                    <div className="flex items-center">
                                        <svg className="mr-2 h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-yellow-800">
                                                {questions.filter((q) => q.isNew).length} unsaved question(s)
                                            </p>
                                            <p className="text-xs text-yellow-600">Remember to save your changes</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex w-full flex-col gap-4 md:w-3/4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Quiz Builder</h1>
                        <Button onClick={handleSaveAll} disabled={isSavingAll || questions.length === 0} className="bg-green-600 hover:bg-green-700">
                            {isSavingAll ? 'Saving All...' : 'Save All'}
                        </Button>
                    </div>

                    <ScrollArea ref={scrollAreaRef} className="h-[85vh] rounded-md border px-4 py-2">
                        {questions.length === 0 && <p className="text-gray-600">No questions yet. Add your first one below!</p>}

                        <div className="space-y-10">
                            {questions.map((question) => (
                                <div
                                    className="mb-4 bg-white p-4"
                                    key={question.id}
                                    ref={(el) => {
                                        questionRefs.current[question.id] = el;
                                    }}
                                >
                                    <QuizQuestionCard
                                        id={question.id}
                                        quiz_id={quiz_id}
                                        questionData={question}
                                        onUpdate={handleUpdate}
                                        onDelete={handleDelete}
                                        isNew={question.isNew ?? false}
                                    />
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </AppLayout>
    );
}
