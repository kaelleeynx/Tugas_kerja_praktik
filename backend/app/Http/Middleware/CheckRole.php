<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @param  string  $role
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user = auth()->user();
        
        // Check if user has one of the required roles
        if (!in_array($user->role, $roles)) {
            $roleString = implode(' atau ', $roles);
            return response()->json([
                'success' => false,
                'message' => "Hanya {$roleString} yang dapat mengakses fitur ini."
            ], 403);
        }

        return $next($request);
    }
}
