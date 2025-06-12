<?php

namespace App\Services;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class QuizQuestionService
{
    protected function getCacheKey($quizId)
    {
        return "quiz:$quizId:questions";
    }

    protected function getQuizCacheKeys($quiz)
    {
        $keys = [];

        // Admin cache key
        $keys[] = 'quizzes_admin';

        // Instructor cache key for the quiz owner
        $keys[] = 'quizzes_instructor_' . $quiz->user_id;

        return $keys;
    }

    protected function updateQuizTotals(int $quizId)
    {
        $quiz = Quiz::with(['questions', 'creator'])->findOrFail($quizId);

        $totalScore = $quiz->questions->sum('score');
        $totalTime = $quiz->questions->sum(function ($q) {
            return $q->time ?? 0;
        });

        $quiz->update([
            'total_score' => $totalScore,
            'total_time' => $totalTime,
        ]);

        // Update quiz caches with new totals
        $this->updateQuizCaches($quiz);

        return $quiz;
    }

    protected function updateQuizCaches($quiz)
    {
        $transformed = [
            'id' => $quiz->id,
            'user_id' => $quiz->user_id,
            'creator' => $quiz->creator,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'mode' => $quiz->mode,
            'total_score' => $quiz->total_score,
            'total_time' => $quiz->total_time,
            'created_at' => $quiz->created_at,
            'updated_at' => $quiz->updated_at,
        ];

        $cacheKeys = $this->getQuizCacheKeys($quiz);

        foreach ($cacheKeys as $cacheKey) {
            $cachedQuizzes = Cache::get($cacheKey);

            if ($cachedQuizzes) {
                $updatedQuizzes = $cachedQuizzes->map(function ($cachedQuiz) use ($transformed) {
                    return $cachedQuiz['id'] === $transformed['id'] ? $transformed : $cachedQuiz;
                });

                Cache::put($cacheKey, $updatedQuizzes, 600);
            }
        }
    }

    public function getQuestions($quizId)
    {
        $cacheKey = $this->getCacheKey($quizId);

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($quizId) {
            return QuizQuestion::with('choices')
                ->where('quiz_id', $quizId)
                ->get();
        });
    }

    public function storeQuestion(array $data)
    {
        $question = QuizQuestion::create([
            'quiz_id' => $data['quiz_id'],
            'question' => $data['question'],
            'question_type' => $data['question_type'],
            'score' => $data['score'],
            'time' => $data['time'] ?? null,
            'isRequired' => $data['isRequired'] ?? false,
        ]);

        // Handle choices only for MCQ and checkbox types
        if (
            isset($data['choices']) &&
            is_array($data['choices']) &&
            in_array($data['question_type'], ['multiple_choice', 'checkbox'])
        ) {
            foreach ($data['choices'] as $choice) {
                if (!empty($choice['choice'])) {
                    $question->choices()->create([
                        'choice' => $choice['choice'],
                        'isCorrect' => $choice['isCorrect'] ?? false,
                    ]);
                }
            }
        }

        // Identification type: store correct answer as a single "choice"
        if ($data['question_type'] === 'identification' && !empty($data['correctAnswer'])) {
            $question->choices()->create([
                'choice' => $data['correctAnswer'],
                'isCorrect' => true, // assume only 1 correct answer
            ]);
        }

        // Update quiz totals and synchronize caches
        $this->updateQuizTotals($data['quiz_id']);

        // Refresh question cache
        $this->refreshCache($data['quiz_id']);

        return $question;
    }

    public function updateQuestion(QuizQuestion $question, array $data)
    {
        $question->update([
            'question' => $data['question'],
            'question_type' => $data['question_type'],
            'score' => $data['score'],
            'time' => $data['time'] ?? null,
            'isRequired' => $data['isRequired'] ?? false,
        ]);

        $question->choices()->delete();

        if (in_array($data['question_type'], ['multiple_choice', 'checkbox']) && isset($data['choices'])) {
            foreach ($data['choices'] as $choice) {
                $question->choices()->create([
                    'choice' => $choice['choice'],
                    'isCorrect' => $choice['isCorrect'] ?? false,
                ]);
            }
        }

        if ($data['question_type'] === 'identification' && !empty($data['correctAnswer'])) {
            $question->choices()->create([
                'choice' => $data['correctAnswer'],
                'isCorrect' => true,
            ]);
        }

        // Update quiz totals and synchronize caches
        $this->updateQuizTotals($question->quiz_id);

        // Refresh question cache
        $this->refreshCache($question->quiz_id);

        return $question;
    }

    public function deleteQuestion(QuizQuestion $question)
    {
        $quizId = $question->quiz_id;
        $question->delete();

        // Update quiz totals and synchronize caches
        $this->updateQuizTotals($quizId);

        // Refresh question cache
        $this->refreshCache($quizId);
    }

    protected function refreshCache($quizId)
    {
        Cache::forget($this->getCacheKey($quizId));

        Cache::put(
            $this->getCacheKey($quizId),
            QuizQuestion::with('choices')
                ->where('quiz_id', $quizId)
                ->get(),
            now()->addMinutes(10)
        );
    }
}
