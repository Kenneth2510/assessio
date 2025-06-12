<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use App\Services\QuizQuestionService;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class QuizQuestionController extends Controller
{
    protected $service;

    public function __construct(QuizQuestionService $service)
    {
        $this->service = $service;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $questions = $this->service->getQuestions($request->query('quiz_id'));
        return Inertia::render('quiz-question-management/index', [
            'quiz_id' => $request->query('quiz_id'),
            'quiz_questions' => $questions
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $rules = [
            'quiz_id' => ['required', 'exists:quizzes,id'],
            'question' => ['required', 'string'],
            'question_type' => ['required', 'string', Rule::in(['multiple_choice', 'identification', 'checkbox'])],
            'score' => ['required', 'integer', 'min:0'],
            'time' => ['nullable', 'integer'],
            'isRequired' => ['boolean'],
        ];

        // Apply choices validation conditionally
        if (in_array($request->question_type, ['multiple_choice', 'checkbox'])) {
            $rules['choices'] = ['required', 'array'];
            $rules['choices.*.choice'] = ['required', 'string'];
            $rules['choices.*.isCorrect'] = ['boolean'];
        } else {
            $rules['choices'] = ['nullable', 'array'];
        }

        if ($request->question_type === 'identification') {
            $rules['correctAnswer'] = ['required', 'string'];
        }

        $validated = $request->validate($rules);

        $this->service->storeQuestion($validated);

        return back()->with('success', 'Question saved and cache updated.');
    }

    /**
     * Display the specified resource.
     */
    public function show(QuizQuestion $quizQuestion)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(QuizQuestion $quizQuestion)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, QuizQuestion $quiz_question_management)
    {
        $rules = [
            'question' => 'required|string',
            'question_type' => ['required', 'string', Rule::in(['multiple_choice', 'identification', 'checkbox'])],
            'score' => 'required|integer|min:0',
            'time' => 'nullable|integer',
            'isRequired' => 'boolean',
        ];

        if (in_array($request->question_type, ['multiple_choice', 'checkbox'])) {
            $rules['choices'] = ['required', 'array'];
            $rules['choices.*.choice'] = ['required', 'string'];
            $rules['choices.*.isCorrect'] = ['boolean'];
        } else {
            $rules['choices'] = ['nullable', 'array'];
        }

        if ($request->question_type === 'identification') {
            $rules['correctAnswer'] = ['required', 'string'];
        }

        $validated = $request->validate($rules);

        $this->service->updateQuestion($quiz_question_management, $validated);

        return back()->with('success', 'Question updated and cache refreshed.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(QuizQuestion $quiz_question_management)
    {
        $this->service->deleteQuestion($quiz_question_management);

        return back()->with('success', 'Question deleted and cache refreshed.');
    }
}
