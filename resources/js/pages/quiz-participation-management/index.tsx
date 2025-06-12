import MySwal from '@/components/swal-alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Clock, CheckCircle, AlertCircle, Save } from 'lucide-react';
import QuizQuestionViewer from './QuizQuestionViewer';
import QuizSidebar from './QuizSidebar';

interface Question {
    id: number;
    question: string;
    question_type: 'multiple_choice' | 'checkbox' | 'identification';
    choices?: { choice: string; isCorrect: boolean }[];
}

interface Props {
    quiz: {
        id: number;
        title: string;
        description?: string;
        total_time?: number; // This is in seconds from the backend
        mode: 'standard' | 'focused';
    };
    questions: Question[];
}

export default function QuizTaker({ quiz, questions }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    // Fixed: total_time is already in seconds, no need to multiply by 60
    const [timeRemaining, setTimeRemaining] = useState(quiz.total_time || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Ref to store question elements for scrolling
    const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    const form = useForm({
        quiz_id: quiz.id,
        answers: [],
    });

    // Auto-save functionality
    const autoSave = useCallback(async () => {
        if (Object.keys(answers).length === 0) return;

        setAutoSaveStatus('saving');
        try {
            // Simulate auto-save API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setAutoSaveStatus('saved');
            setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } catch (error) {
            setAutoSaveStatus('error');
            setTimeout(() => setAutoSaveStatus('idle'), 3000);
        }
    }, [answers]);

    // Auto-save every 30 seconds
    useEffect(() => {
        const interval = setInterval(autoSave, 30000);
        return () => clearInterval(interval);
    }, [autoSave]);

    // Timer functionality
    useEffect(() => {
        if (!timeRemaining || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev && prev <= 1) {
                    handleSubmit(true); // Auto-submit when time runs out
                    return 0;
                }
                return prev ? prev - 1 : null;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (quiz.mode === 'focused') {
                if (e.key === 'ArrowLeft' && currentIndex > 0) {
                    setCurrentIndex(currentIndex - 1);
                } else if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentIndex, questions.length, quiz.mode]);

    const handleAnswer = (questionId: number, answer: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleNavigation = (index: number) => {
        if (quiz.mode === 'focused' && index >= 0 && index < questions.length) {
            setCurrentIndex(index);
        } else if (quiz.mode === 'standard') {
            // Scroll to the specific question in standard mode
            const questionElement = questionRefs.current[questions[index].id];
            if (questionElement) {
                questionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            }
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleSubmit = async (isAutoSubmit = false) => {
        if (isSubmitting) return;

        const unansweredCount = questions.length - Object.keys(answers).length;

        if (unansweredCount > 0 && !isAutoSubmit) {
            const result = await MySwal.fire({
                title: 'Incomplete Quiz',
                text: `You have ${unansweredCount} unanswered question(s). Do you want to submit anyway?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, submit anyway',
                cancelButtonText: 'Continue quiz',
                confirmButtonColor: '#ef4444',
            });

            if (!result.isConfirmed) return;
        }

        const confirmResult = await MySwal.fire({
            title: isAutoSubmit ? 'Time\'s Up!' : 'Submit Quiz?',
            text: isAutoSubmit
                ? 'Your time has expired. Your answers will be submitted automatically.'
                : 'Are you sure you want to submit your quiz?',
            icon: isAutoSubmit ? 'info' : 'question',
            showCancelButton: !isAutoSubmit,
            confirmButtonText: 'Submit',
            cancelButtonText: 'Cancel',
            allowOutsideClick: !isAutoSubmit,
            allowEscapeKey: !isAutoSubmit,
        });

        if (!confirmResult.isConfirmed && !isAutoSubmit) return;

        setIsSubmitting(true);

        const transformedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
            question_id: Number(questionId),
            answer,
        }));

        form.data.quiz_id = quiz.id;
        form.data.answers = transformedAnswers;

        MySwal.fire({
            title: 'Submitting Quiz...',
            text: 'Please wait while we process your answers',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                MySwal.showLoading();
            },
        });

        form.post(route('quiz-participation.store'), {
            onSuccess: () => {
                MySwal.fire({
                    icon: 'success',
                    title: 'Quiz Submitted Successfully!',
                    text: 'Your answers have been recorded.',
                    confirmButtonText: 'View Results',
                    timer: 5000,
                    timerProgressBar: true,
                });
            },
            onError: (errors) => {
                console.error('Submission errors:', errors);
                setIsSubmitting(false);
                MySwal.fire({
                    icon: 'error',
                    title: 'Submission Failed',
                    text: 'There was an error submitting your quiz. Please try again.',
                    confirmButtonText: 'Retry',
                    footer: Object.keys(errors).length > 0 ? 'Please check your answers and try again.' : undefined,
                });
            },
        });
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    };

    const progressPercentage = useMemo(() => {
        return (Object.keys(answers).length / questions.length) * 100;
    }, [answers, questions.length]);

    const isTimeWarning = timeRemaining && timeRemaining <= 300; // 5 minutes
    const isTimeCritical = timeRemaining && timeRemaining <= 60; // 1 minute

    return (
        <AppLayout breadcrumbs={[{ title: 'Take Quiz', href: '#' }]}>
            <Head title={`Take Quiz: ${quiz.title}`} />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                {/* Header with Timer and Progress */}
                <Card className="mb-6 shadow-lg">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-bold text-blue-900">{quiz.title}</CardTitle>
                                {quiz.description && (
                                    <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Auto-save status */}
                                <div className="flex items-center gap-2 text-sm">
                                    {autoSaveStatus === 'saving' && (
                                        <>
                                            <Save className="h-4 w-4 animate-spin" />
                                            <span className="text-gray-600">Saving...</span>
                                        </>
                                    )}
                                    {autoSaveStatus === 'saved' && (
                                        <>
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span className="text-green-600">Saved</span>
                                        </>
                                    )}
                                    {autoSaveStatus === 'error' && (
                                        <>
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                            <span className="text-red-600">Save failed</span>
                                        </>
                                    )}
                                </div>

                                {/* Timer */}
                                {timeRemaining !== null && (
                                    <Badge
                                        variant={isTimeCritical ? "destructive" : isTimeWarning ? "secondary" : "default"}
                                        className="flex items-center gap-2 px-3 py-1 text-sm font-mono"
                                    >
                                        <Clock className="h-4 w-4" />
                                        {formatTime(timeRemaining)}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Progress: {Object.keys(answers).length} of {questions.length} answered</span>
                                <span>{Math.round(progressPercentage)}% complete</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                        </div>
                    </CardHeader>
                </Card>

                <div className="flex flex-col gap-6 lg:flex-row">
                    {/* Sidebar */}
                    <QuizSidebar
                        quiz={quiz}
                        currentIndex={currentIndex}
                        totalQuestions={questions.length}
                        answers={answers}
                        questions={questions}
                        onNavigate={handleNavigation} // Always allow navigation
                        timeRemaining={timeRemaining}
                        formatTime={formatTime} // Pass the updated formatTime function
                    />

                    {/* Main Content */}
                    <div className="flex-1 space-y-4">
                        {quiz.mode === 'standard' && (
                            <Card className="shadow-lg">
                                <CardContent className="p-6">
                                    <ScrollArea className="h-[70vh] pr-4">
                                        <div className="space-y-8">
                                            {questions.map((question, index) => (
                                                <div
                                                    key={question.id}
                                                    className="border-b border-gray-200 pb-6 last:border-b-0"
                                                    ref={el => questionRefs.current[question.id] = el}
                                                >
                                                    <div className="mb-4">
                                                        <Badge variant="outline" className="mb-2">
                                                            Question {index + 1}
                                                        </Badge>
                                                        {answers[question.id] && (
                                                            <CheckCircle className="inline ml-2 h-4 w-4 text-green-500" />
                                                        )}
                                                    </div>
                                                    <QuizQuestionViewer
                                                        question={question}
                                                        answer={answers[question.id]}
                                                        onAnswer={(answer) => handleAnswer(question.id, answer)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    <div className="mt-6 pt-4 border-t">
                                        <Button
                                            size="lg"
                                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                                            onClick={() => handleSubmit()}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {quiz.mode === 'focused' && (
                            <>
                                <Card className="shadow-lg">
                                    <CardContent className="p-6">
                                        <div className="mb-4">
                                            <Badge variant="outline" className="mb-2">
                                                Question {currentIndex + 1} of {questions.length}
                                            </Badge>
                                            {answers[questions[currentIndex].id] && (
                                                <CheckCircle className="inline ml-2 h-4 w-4 text-green-500" />
                                            )}
                                        </div>

                                        <ScrollArea className="h-[50vh]">
                                            <QuizQuestionViewer
                                                question={questions[currentIndex]}
                                                answer={answers[questions[currentIndex].id]}
                                                onAnswer={(answer) => handleAnswer(questions[currentIndex].id, answer)}
                                            />
                                        </ScrollArea>
                                    </CardContent>
                                </Card>

                                {/* Navigation Controls */}
                                <Card className="shadow-lg">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-center gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={handlePrevious}
                                                disabled={currentIndex === 0}
                                                className="flex-1"
                                            >
                                                Previous
                                            </Button>

                                            <div className="text-sm text-gray-600 px-4">
                                                Use ← → keys to navigate
                                            </div>

                                            {currentIndex < questions.length - 1 ? (
                                                <Button
                                                    onClick={handleNext}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                                >
                                                    Next
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={() => handleSubmit()}
                                                    disabled={isSubmitting}
                                                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                                >
                                                    {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
