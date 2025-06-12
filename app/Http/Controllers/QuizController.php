<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\SkillTags;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class QuizController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        $cacheKey = $user->hasRole('admin') ? 'quizzes_admin' : 'quizzes_instructor_' . $user->id;

        $quizzes = Cache::remember($cacheKey, 600, function () use ($user) {
            $query = Quiz::with(['creator', 'skillTags']);

            if ($user->hasRole('instructor')) {
                $query->where('user_id', $user->id);
            }

            return $query->get()->map(function ($quiz) {
                return [
                    'id' => $quiz->id,
                    'user_id' => $quiz->user_id,
                    'creator' => $quiz->creator,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'mode' => $quiz->mode,
                    'total_score' => $quiz->total_score,
                    'total_time' => $quiz->total_time,
                    'skill_tags' => $quiz->skillTags->map(fn($tag) => [
                        'id' => $tag->id,
                        'tag_title' => $tag->tag_title,
                        'description' => $tag->description
                    ]),
                    'created_at' => $quiz->created_at,
                    'updated_at' => $quiz->updated_at,
                ];
            });
        });

        return Inertia::render('quiz-management/index', [
            'quizzes' => $quizzes,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('quiz-management/actions/create', [
            'skillTags' => SkillTags::select('id', 'tag_title', 'description')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'mode' => 'required|string|in:standard,focused',
            'skill_tag_ids' => 'array',
            'skill_tag_ids.*' => 'exists:skill_tags,id'
        ]);

        $quiz = Quiz::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'mode' => $validated['mode'],
            'user_id' => $user->id,
            'total_score' => 0,
            'total_time' => 0
        ]);

        // Attach skill tags if provided
        if (!empty($validated['skill_tag_ids'])) {
            $quiz->skillTags()->attach($validated['skill_tag_ids']);
        }

        // Fetch the fresh quiz with relationships
        $quiz->load(['creator', 'skillTags']);

        // Transform to match your cache structure
        $transformed = [
            'id' => $quiz->id,
            'user_id' => $quiz->user_id,
            'creator' => $quiz->creator,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'mode' => $quiz->mode,
            'total_score' => $quiz->total_score,
            'total_time' => $quiz->total_time,
            'skill_tags' => $quiz->skillTags->map(fn($tag) => [
                'id' => $tag->id,
                'tag_title' => $tag->tag_title,
                'description' => $tag->description
            ]),
            'created_at' => $quiz->created_at,
            'updated_at' => $quiz->updated_at,
        ];

        // Write-through cache logic
        if ($user->hasRole('admin')) {
            $adminCacheKey = 'quizzes_admin';
            $adminQuizzes = Cache::get($adminCacheKey, collect());
            Cache::put($adminCacheKey, $adminQuizzes->push($transformed), 600);
        }

        if ($user->hasRole('instructor')) {
            $instructorCacheKey = 'quizzes_instructor_' . $user->id;
            $instructorQuizzes = Cache::get($instructorCacheKey, collect());
            Cache::put($instructorCacheKey, $instructorQuizzes->push($transformed), 600);
        }

        return redirect()->route('quiz-management.index')->with('success', 'Quiz created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Quiz $quiz_management)
    {
        $quiz = Quiz::with(['creator', 'skillTags'])->where('id', $quiz_management->id)->first();
        return Inertia::render('quiz-management/actions/view', [
            'quiz' => $quiz,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Quiz $quiz_management)
    {
        $quiz_management->load('skillTags');

        return Inertia::render('quiz-management/actions/edit', [
            'quiz' => $quiz_management,
            'skillTags' => SkillTags::select('id', 'tag_title', 'description')->get(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Quiz $quiz_management)
    {
        $user = Auth::user();
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'mode' => 'required|string|in:standard,focused',
            'skill_tag_ids' => 'array',
            'skill_tag_ids.*' => 'exists:skill_tags,id'
        ]);

        $quiz_management->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'mode' => $validated['mode'],
        ]);

        // Sync skill tags (this will add new ones and remove old ones)
        $quiz_management->skillTags()->sync($validated['skill_tag_ids'] ?? []);

        // Fetch the fresh quiz with relationships
        $quiz_management->load(['creator', 'skillTags']);

        // Transform to match your cache structure
        $transformed = [
            'id' => $quiz_management->id,
            'user_id' => $quiz_management->user_id,
            'creator' => $quiz_management->creator,
            'title' => $quiz_management->title,
            'description' => $quiz_management->description,
            'mode' => $quiz_management->mode,
            'total_score' => $quiz_management->total_score,
            'total_time' => $quiz_management->total_time,
            'skill_tags' => $quiz_management->skillTags->map(fn($tag) => [
                'id' => $tag->id,
                'tag_title' => $tag->tag_title,
                'description' => $tag->description
            ]),
            'created_at' => $quiz_management->created_at,
            'updated_at' => $quiz_management->updated_at,
        ];

        // Write-through cache logic
        if ($user->hasRole('admin')) {
            $adminCacheKey = 'quizzes_admin';
            $adminQuizzes = Cache::get($adminCacheKey, collect());

            $adminQuizzes = $adminQuizzes->map(function ($quiz) use ($transformed) {
                return $quiz['id'] === $transformed['id'] ? $transformed : $quiz;
            });

            Cache::put($adminCacheKey, $adminQuizzes, 600);
        }

        if ($user->hasRole('instructor')) {
            $instructorCacheKey = 'quizzes_instructor_' . $user->id;
            $instructorQuizzes = Cache::get($instructorCacheKey, collect());

            $instructorQuizzes = $instructorQuizzes->map(function ($quiz) use ($transformed) {
                return $quiz['id'] === $transformed['id'] ? $transformed : $quiz;
            });

            Cache::put($instructorCacheKey, $instructorQuizzes, 600);
        }

        return redirect()->route('quiz-management.index')->with('success', 'Quiz updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Quiz $quiz_management)
    {
        $user = Auth::user();

        // Delete from database (skill tags will be automatically removed due to cascade)
        $quiz_management->delete();

        // Prepare transformed ID for filtering
        $quizId = $quiz_management->id;

        // Admin cache
        if ($user->hasRole('admin')) {
            $adminCacheKey = 'quizzes_admin';
            $adminQuizzes = Cache::get($adminCacheKey, collect());
            $filteredAdminQuizzes = $adminQuizzes->reject(fn($quiz) => $quiz['id'] == $quizId);
            Cache::put($adminCacheKey, $filteredAdminQuizzes, 600);
        }

        // Instructor cache
        if ($user->hasRole('instructor')) {
            $instructorCacheKey = 'quizzes_instructor_' . $user->id;
            $instructorQuizzes = Cache::get($instructorCacheKey, collect());
            $filteredInstructorQuizzes = $instructorQuizzes->reject(fn($quiz) => $quiz['id'] == $quizId);
            Cache::put($instructorCacheKey, $filteredInstructorQuizzes, 600);
        }

        return redirect()->route('quiz-management.index')->with('success', 'Quiz deleted successfully!');
    }
}
