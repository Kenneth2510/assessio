<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function dashboard()
    {
        $user = Auth::user();

        if ($user->hasRole('admin')) {
            return redirect()->intended(route('admin.dashboard', absolute: false));
        }
        if ($user->hasRole('instructor')) {
            return redirect()->intended(route('instructor.dashboard', absolute: false));
        }
        if ($user->hasRole('learner')) {
            return redirect()->intended(route('learner.dashboard', absolute: false));
        }
        // return Inertia::render('dashboard/admin');
    }
    public function admin()
    {
        return Inertia::render('dashboard/admin');
    }

    public function learner()
    {
        return Inertia::render('dashboard/learner');
    }

    public function instructor()
    {
        return Inertia::render('dashboard/instructor');
    }
}
