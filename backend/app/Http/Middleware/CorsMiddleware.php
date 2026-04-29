<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    /**
     * Handle an incoming request.
     * Only allows origins defined in CORS_ALLOWED_ORIGINS env var.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->header('Origin');
        $allowedOrigins = array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')));

        // Check Railway pattern too
        $isRailwayOrigin = $origin && preg_match('#^https://.*\.up\.railway\.app$#', $origin);
        $isAllowed = $origin && (in_array($origin, $allowedOrigins) || $isRailwayOrigin);

        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            $response = response('', 200)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
                ->header('Access-Control-Max-Age', '86400');

            if ($isAllowed) {
                $response->header('Access-Control-Allow-Origin', $origin);
                $response->header('Access-Control-Allow-Credentials', 'true');
            }

            return $response;
        }

        $response = $next($request);

        if ($isAllowed) {
            $response->header('Access-Control-Allow-Origin', $origin);
            $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
            $response->header('Access-Control-Allow-Credentials', 'true');
        }

        return $response;
    }
}
