import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Trophy, Clock, Target, Star } from 'lucide-react';
import QuizResultsOverview from './QuizResultsOverview';
import QuizResultsAnalytics from './QuizResultsAnalytics';
import QuizResultsQuestions from './QuizResultsQuestions';
import QuizResultsSidebar from './QuizResultsSidebar';

interface QuizResultsProps {
    results: {
        participation_id: number;
        quiz_title: string;
        quiz_description?: string;
        total_score: number;
        max_possible_score: number;
        xp_earned: number;
        time_taken: number;
        quiz_time_limit?: number;
        completed_at: string;
        status: string;
        total_questions: number;
        correct_answers: number;
        incorrect_answers: number;
        unanswered_questions: number;
        percentage: number;
    };
    questions: Array<{
        question_id: number;
        question_text: string;
        question_type: 'multiple_choice' | 'checkbox' | 'identification';
        question_score: number;
        user_answer: any;
        user_answer_display: string;
        correct_answer: any;
        correct_answer_display: string;
        is_correct: boolean;
        points_earned: number;
        choices?: Array<{
            choice: string;
            is_correct: boolean;
        }>;
    }>;
    performance: {
        grade: string;
        performance_level: string;
        strengths: string[];
        areas_for_improvement: string[];
    };
    type_analysis: Record<string, any>;
    xp_breakdown: any;
    quiz: {
        id: number;
        title: string;
        description?: string;
        total_time?: number;
        mode: string;
    };
    is_first_attempt: boolean;
    can_retake: boolean;
}

export default function QuizResults({
    results,
    questions,
    performance,
    type_analysis,
    xp_breakdown,
    quiz,
    is_first_attempt,
    can_retake
}: QuizResultsProps) {
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m ${secs}s`;
        } else {
            return `${mins}m ${secs}s`;
        }
    };

    const getGradeColor = (grade: string) => {
        switch (grade.toUpperCase()) {
            case 'A': return 'text-green-600 bg-green-50 border-green-200';
            case 'B': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'D': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'F': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Quizzes', href: route('quiz-access.index') },
            { title: quiz.title, href: route('quiz-access.show', quiz.id) },
            { title: 'Results', href: '#' }
        ]}>
            <Head title={`Quiz Results: ${quiz.title}`} />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                {/* Header */}
                <div className="mb-6">
                    <Button asChild variant="outline" className="mb-4">
                        <Link href={route('quiz.analytics', quiz.id)} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Quiz
                        </Link>
                    </Button>

                    <Card className="shadow-lg">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-3xl font-bold text-blue-900 mb-2">
                                        Quiz Results
                                    </CardTitle>
                                    <h2 className="text-xl text-gray-700">{results.quiz_title}</h2>
                                    {results.quiz_description && (
                                        <p className="text-sm text-gray-600 mt-1">{results.quiz_description}</p>
                                    )}
                                </div>
                                <div className="text-right space-y-2">
                                    <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 ${getGradeColor(performance.grade)}`}>
                                        <Trophy className="h-5 w-5 mr-2" />
                                        <span className="text-2xl font-bold">Grade {performance.grade}</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Completed on {new Date(results.completed_at).toLocaleDateString()}
                                    </div>
                                    {is_first_attempt && (
                                        <Badge variant="secondary" className="ml-2">
                                            First Attempt
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                <div className="flex flex-col gap-6 lg:flex-row">
                    {/* Sidebar */}
                    <QuizResultsSidebar
                        results={results}
                        performance={performance}
                        quiz={quiz}
                        can_retake={can_retake}
                        formatTime={formatTime}
                    />

                    {/* Main Content */}
                    <div className="flex-1 space-y-6">
                        {/* Overview Cards */}
                        <QuizResultsOverview
                            results={results}
                            performance={performance}
                            formatTime={formatTime}
                        />

                        {/* Analytics */}
                        <QuizResultsAnalytics
                            results={results}
                            type_analysis={type_analysis}
                            performance={performance}
                            xp_breakdown={xp_breakdown}
                        />

                        {/* Detailed Questions Review */}
                        <QuizResultsQuestions
                            questions={questions}
                            results={results}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
