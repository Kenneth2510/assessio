<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class InstructorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $instructors = Cache::remember('instructor_users', 600, function () {
            return User::role('instructor')->get()->map(function ($instructor) {
                return [
                    'id' => $instructor->id,
                    'name' => $instructor->name,
                    'email' => $instructor->email,
                    'status' => $instructor->status,
                    'created_at' => $instructor->created_at,
                    'updated_at' => $instructor->updated_at,
                ];
            });
        });

        return Inertia::render('user-management/instructor/index', [
            'instructors' => $instructors,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('user-management/instructor/actions/create');
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

        $instructor = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'status' => 'active',
            'password' => Hash::make($validated['password']),
        ]);

        $instructor->syncRoles(['instructor']);

        $instructors = User::role('instructor')->get();
        Cache::put('instructor_users', $instructors, 600);

        return to_route('instructor.index')->with('success', 'Instructor created succesfully');
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
    public function edit(User $instructor)
    {
        return Inertia::render('user-management/instructor/actions/edit', [
            'instructor' => $instructor
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $instructor)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $instructor->id,
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

        $instructor->update($updateData);

        $instructors = User::role('instructor')->get();
        Cache::put('instructor_users', $instructors, 600);

        return to_route('instructor.index')->with('success', 'Instructor updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $instructor)
    {
        $instructor->delete();

        $instructors = User::role('instructor')->get();
        Cache::put('instructor_users', $instructors, 600);

        return to_route('instructor.index')->with('success', 'Instructor deleted successfully');
    }
}
