<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class LearnerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $learners = Cache::remember('learner_users', 600, function () {
            return User::role('learner')->get()->map(function ($learner) {
                return [
                    'id' => $learner->id,
                    'name' => $learner->name,
                    'email' => $learner->email,
                    'status' => $learner->status,
                    'created_at' => $learner->created_at,
                    'updated_at' => $learner->updated_at,
                ];
            });
        });

        return Inertia::render('user-management/learner/index', [
            'learners' => $learners,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('user-management/learner/actions/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $learner = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'status' => 'active',
            'password' => Hash::make($validated['password']),
        ]);

        $learner->syncRoles(['learner']);

        $learners = User::role('learner')->get();
        Cache::put('learner_users', $learners, 600);

        return to_route('learner.index')->with('success', 'Learner created succesfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $learner)
    {
        return Inertia::render('user-management/learner/actions/edit', [
            'learner' => $learner
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $learner)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $learner->id,
            'password' => 'nullable|string|min:8|confirmed',
            'status' => 'required',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'status' => $validated['status'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $learner->update($updateData);

        $learners = User::role('learner')->get();
        Cache::put('learner_users', $learners, 600);

        return to_route('learner.index')->with('success', 'Learner updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $learner)
    {
        $learner->delete();

        $learners = User::role('learner')->get();
        Cache::put('learner_users', $learners, 600);

        return to_route('learner.index')->with('success', 'Learner deleted successfully');
    }
}
