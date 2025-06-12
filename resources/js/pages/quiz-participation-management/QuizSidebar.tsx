import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from '@inertiajs/react';
import { CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';

interface Question {
    id: number;
    question: string;
    question_type: 'multiple_choice' | 'checkbox' | 'identification';
    choices?: { choice: string; isCorrect: boolean }[];
}

interface Props {
    quiz: {
        title: string;
        total_score?: number;
        total_time?: number;
        mode: 'standard' | 'focused';
    };
    currentIndex: number;
    totalQuestions: number;
    answers: Record<number, any>;
    questions: Question[];
    onNavigate?: (index: number) => void;
    timeRemaining?: number | null;
    formatTime?: (seconds: number) => string;
}

export default function QuizSidebar({
    quiz,
    currentIndex,
    totalQuestions,
    answers,
    questions,
    onNavigate,
    timeRemaining,
    formatTime
}: Props) {
    const answeredCount = Object.keys(answers).length;
    const progressPercentage = (answeredCount / totalQuestions) * 100;

    const defaultFormatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    };

    const timeFormatter = formatTime || defaultFormatTime;

    const isTimeWarning = timeRemaining && timeRemaining <= 300; // 5 minutes
    const isTimeCritical = timeRemaining && timeRemaining <= 60; // 1 minute

    return (
        <div className="w-full lg:w-80 space-y-4">
            {/* Back Button */}
            <Button asChild variant="outline" className="w-full">
                <Link href={route('quiz-access.show', quiz.id)} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Quiz Info
                </Link>
            </Button>

            {/* Quiz Info Card */}
            <Card className="shadow-lg">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-blue-900">{quiz.title}</CardTitle>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Question {currentIndex + 1} of {totalQuestions}</span>
                        <Badge variant="outline">
                            {answeredCount}/{totalQuestions} answered
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Progress */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm text-gray-600">{Math.round(progressPercentage)}%</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                    </div>

                    {/* Time Information */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Time</span>
                        </div>
                        {timeRemaining !== null ? (
                            <div className={`text-lg font-bold font-mono ${
                                isTimeCritical ? 'text-red-600' :
                                isTimeWarning ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                                {timeFormatter(timeRemaining)}
                                {isTimeWarning && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <AlertCircle className="h-3 w-3" />
                                        <span className="text-xs font-normal">
                                            {isTimeCritical ? 'Time almost up!' : 'Time warning'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-sm text-gray-500">No time limit</span>
                        )}
                    </div>

                    {/* Question Grid */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-gray-700">Questions</span>
                            <Badge variant="secondary" className="text-xs">
                                Click to {quiz.mode === 'focused' ? 'navigate' : 'jump to'}
                            </Badge>
                        </div>
                        <ScrollArea className="h-48 rounded-md border bg-gray-50 p-3">
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((question, i) => {
                                    const isAnswered = answers[question.id] !== undefined;
                                    const isCurrent = i === currentIndex;

                                    return (
                                        <button
                                            key={question.id}
                                            onClick={() => onNavigate?.(i)}
                                            className={`
                                                relative h-10 w-10 rounded-lg text-sm font-bold transition-all duration-200
                                                ${isCurrent
                                                    ? 'ring-2 ring-blue-500 ring-offset-2'
                                                    : 'hover:scale-105'
                                                }
                                                ${isAnswered
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                                                }
                                                cursor-pointer hover:shadow-md
                                            `}
                                            title={`Question ${i + 1}${isAnswered ? ' (Answered)' : ''} - ${quiz.mode === 'focused' ? 'Click to navigate' : 'Click to jump to this question'}`}
                                        >
                                            {i + 1}
                                            {isAnswered && (
                                                <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-500 bg-white rounded-full" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Statistics */}
                    <div className="pt-2 border-t">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-lg font-bold text-green-600">{answeredCount}</div>
                                <div className="text-xs text-gray-500">Answered</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-gray-600">{totalQuestions - answeredCount}</div>
                                <div className="text-xs text-gray-500">Remaining</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
