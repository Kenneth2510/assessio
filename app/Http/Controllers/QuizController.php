<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\SkillTags;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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

        try {
            $transformed = DB::transaction(function () use ($validated, $user) {
                // Create the quiz
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

                // Update cache within transaction for consistency
                $this->updateCacheAfterStore($user, $transformed);

                return $transformed;
            });

            return redirect()->route('quiz-management.index')->with('success', 'Quiz created successfully!');
        } catch (Exception $e) {
            Log::error('Quiz creation failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'data' => $validated
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to create quiz. Please try again.');
        }
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

        try {
            $transformed = DB::transaction(function () use ($validated, $quiz_management, $user) {
                // Update the quiz
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

                // Update cache within transaction for consistency
                $this->updateCacheAfterUpdate($user, $transformed);

                return $transformed;
            });

            return redirect()->route('quiz-management.index')->with('success', 'Quiz updated successfully!');
        } catch (Exception $e) {
            Log::error('Quiz update failed', [
                'quiz_id' => $quiz_management->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'data' => $validated
            ]);

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to update quiz. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Quiz $quiz_management)
    {
        $user = Auth::user();
        $quizId = $quiz_management->id;

        try {
            DB::transaction(function () use ($quiz_management, $user, $quizId) {
                // Delete from database (skill tags will be automatically removed due to cascade)
                $quiz_management->delete();

                // Update cache within transaction for consistency
                $this->updateCacheAfterDelete($user, $quizId);
            });

            return redirect()->route('quiz-management.index')->with('success', 'Quiz deleted successfully!');
        } catch (Exception $e) {
            Log::error('Quiz deletion failed', [
                'quiz_id' => $quizId,
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()
                ->with('error', 'Failed to delete quiz. Please try again.');
        }
    }

    private function updateCacheAfterStore($user, $transformed)
    {
        try {
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
        } catch (Exception $e) {
            // Log cache errors but don't fail the transaction
            Log::warning('Cache update failed after quiz creation', [
                'quiz_id' => $transformed['id'],
                'error' => $e->getMessage()
            ]);

            // Optionally clear the cache to maintain consistency
            $this->clearUserCaches($user);
        }
    }

    private function updateCacheAfterUpdate($user, $transformed)
    {
        try {
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
        } catch (Exception $e) {
            Log::warning('Cache update failed after quiz update', [
                'quiz_id' => $transformed['id'],
                'error' => $e->getMessage()
            ]);

            $this->clearUserCaches($user);
        }
    }

    /**
     * Update cache after deleting a quiz
     */
    private function updateCacheAfterDelete($user, $quizId)
    {
        try {
            if ($user->hasRole('admin')) {
                $adminCacheKey = 'quizzes_admin';
                $adminQuizzes = Cache::get($adminCacheKey, collect());
                $filteredAdminQuizzes = $adminQuizzes->reject(fn($quiz) => $quiz['id'] == $quizId);
                Cache::put($adminCacheKey, $filteredAdminQuizzes, 600);
            }

            if ($user->hasRole('instructor')) {
                $instructorCacheKey = 'quizzes_instructor_' . $user->id;
                $instructorQuizzes = Cache::get($instructorCacheKey, collect());
                $filteredInstructorQuizzes = $instructorQuizzes->reject(fn($quiz) => $quiz['id'] == $quizId);
                Cache::put($instructorCacheKey, $filteredInstructorQuizzes, 600);
            }
        } catch (Exception $e) {
            Log::warning('Cache update failed after quiz deletion', [
                'quiz_id' => $quizId,
                'error' => $e->getMessage()
            ]);

            $this->clearUserCaches($user);
        }
    }

    /**
     * Clear user-specific caches in case of cache errors
     */
    private function clearUserCaches($user)
    {
        try {
            if ($user->hasRole('admin')) {
                Cache::forget('quizzes_admin');
            }
            if ($user->hasRole('instructor')) {
                Cache::forget('quizzes_instructor_' . $user->id);
            }
        } catch (Exception $e) {
            Log::error('Failed to clear user caches', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
