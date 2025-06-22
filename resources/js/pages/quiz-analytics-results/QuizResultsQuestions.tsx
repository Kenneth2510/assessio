import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Circle,
    Square,
    Type,
    Eye,
    EyeOff,
    Filter
} from 'lucide-react';
import { useState } from 'react';

interface Question {
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
}

interface QuizResultsQuestionsProps {
    questions: Question[];
    results: {
        total_questions: number;
        correct_answers: number;
        incorrect_answers: number;
        unanswered_questions: number;
    };
}

export default function QuizResultsQuestions({ questions, results }: QuizResultsQuestionsProps) {
    const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');
    const [showAnswers, setShowAnswers] = useState(true);

    const questionTypeIcons = {
        multiple_choice: <Circle className="h-4 w-4" />,
        checkbox: <Square className="h-4 w-4" />,
        identification: <Type className="h-4 w-4" />
    };

    const questionTypeLabels = {
        multiple_choice: 'Single Choice',
        checkbox: 'Multiple Choice',
        identification: 'Text Answer'
    };

    const filteredQuestions = questions.filter(question => {
        switch (filter) {
            case 'correct':
                return question.is_correct;
            case 'incorrect':
                return !question.is_correct && question.user_answer_display !== 'Not answered';
            case 'unanswered':
                return question.user_answer_display === 'Not answered';
            default:
                return true;
        }
    });

    const getStatusIcon = (question: Question) => {
        if (question.user_answer_display === 'Not answered') {
            return <AlertCircle className="h-5 w-5 text-yellow-500" />;
        }
        return question.is_correct
            ? <CheckCircle className="h-5 w-5 text-green-500" />
            : <XCircle className="h-5 w-5 text-red-500" />;
    };

    const getStatusBadge = (question: Question) => {
        if (question.user_answer_display === 'Not answered') {
            return <Badge variant="secondary">Unanswered</Badge>;
        }
        return question.is_correct
            ? <Badge className="bg-green-100 text-green-800">Correct</Badge>
            : <Badge variant="destructive">Incorrect</Badge>;
    };

    const renderQuestionChoices = (question: Question) => {
        if (!question.choices || question.choices.length === 0) {
            return null;
        }

        return (
            <div className="mt-3 space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Answer Choices:</h5>
                <div className="space-y-1">
                    {question.choices.map((choice, index) => {
                        const isUserAnswer = question.user_answer &&
                            (Array.isArray(question.user_answer)
                                ? question.user_answer.includes(choice.choice)
                                : question.user_answer === choice.choice);

                        return (
                            <div
                                key={index}
                                className={`p-2 rounded text-sm border ${
                                    choice.is_correct
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : isUserAnswer && !choice.is_correct
                                        ? 'bg-red-50 border-red-200 text-red-800'
                                        : 'bg-gray-50 border-gray-200 text-gray-700'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {choice.is_correct && <CheckCircle className="h-4 w-4 text-green-600" />}
                                    {isUserAnswer && !choice.is_correct && <XCircle className="h-4 w-4 text-red-600" />}
                                    <span>{choice.choice}</span>
                                    {choice.is_correct && (
                                        <Badge variant="outline" className="ml-auto text-xs bg-green-100 text-green-700">
                                            Correct
                                        </Badge>
                                    )}
                                    {isUserAnswer && (
                                        <Badge variant="outline" className="ml-auto text-xs">
                                            Your Answer
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-blue-600" />
                        Question Review ({filteredQuestions.length} of {questions.length})
                    </CardTitle>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Filter Buttons */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('all')}
                                className="text-xs"
                            >
                                All ({questions.length})
                            </Button>
                            <Button
                                variant={filter === 'correct' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('correct')}
                                className="text-xs"
                            >
                                Correct ({results.correct_answers})
                            </Button>
                            <Button
                                variant={filter === 'incorrect' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('incorrect')}
                                className="text-xs"
                            >
                                Incorrect ({results.incorrect_answers})
                            </Button>
                            {results.unanswered_questions > 0 && (
                                <Button
                                    variant={filter === 'unanswered' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilter('unanswered')}
                                    className="text-xs"
                                >
                                    Unanswered ({results.unanswered_questions})
                                </Button>
                            )}
                        </div>

                        {/* Toggle Answers */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAnswers(!showAnswers)}
                            className="flex items-center gap-2"
                        >
                            {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {showAnswers ? 'Hide' : 'Show'} Answers
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                        {filteredQuestions.map((question, index) => (
                            <Card key={question.question_id} className="border-l-4 border-l-blue-200">
                                <CardContent className="p-4">
                                    {/* Question Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(question)}
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-gray-600">
                                                        Question {questions.indexOf(question) + 1}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        {questionTypeIcons[question.question_type]}
                                                        <span className="text-xs text-gray-500">
                                                            {questionTypeLabels[question.question_type]}
                                                        </span>
                                                    </div>
                                                </div>
                                                {getStatusBadge(question)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium">
                                                {question.points_earned}/{question.question_score} pts
                                            </div>
                                        </div>
                                    </div>

                                    {/* Question Text */}
                                    <div className="mb-4">
                                        <p className="text-gray-800 font-medium leading-relaxed">
                                            {question.question_text}
                                        </p>
                                    </div>

                                    {showAnswers && (
                                        <div className="space-y-3">
                                            {/* User Answer */}
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <h5 className="text-sm font-medium text-blue-800 mb-1">Your Answer:</h5>
                                                <p className={`text-sm ${
                                                    question.user_answer_display === 'Not answered'
                                                        ? 'text-gray-500 italic'
                                                        : 'text-blue-900'
                                                }`}>
                                                    {question.user_answer_display || 'Not answered'}
                                                </p>
                                            </div>

                                            {/* Correct Answer */}
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <h5 className="text-sm font-medium text-green-800 mb-1">Correct Answer:</h5>
                                                <p className="text-sm text-green-900">
                                                    {question.correct_answer_display}
                                                </p>
                                            </div>

                                            {/* Multiple Choice Options */}
                                            {renderQuestionChoices(question)}

                                            {/* Explanation/Feedback */}
                                            {!question.is_correct && question.user_answer_display !== 'Not answered' && (
                                                <div className="bg-orange-50 rounded-lg p-3">
                                                    <h5 className="text-sm font-medium text-orange-800 mb-1">Feedback:</h5>
                                                    <p className="text-sm text-orange-900">
                                                        Review this topic to improve your understanding.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        {filteredQuestions.length === 0 && (
                            <div className="text-center py-8">
                                <div className="text-gray-500 mb-2">No questions match the current filter</div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFilter('all')}
                                >
                                    Show All Questions
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
