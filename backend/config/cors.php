<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Restricts API access to known frontend origins only.
    | The wildcard '*' with credentials is invalid per spec and insecure.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')),

    'allowed_origins_patterns' => [
        // Allow Railway preview deployments
        '#^https://.*\.up\.railway\.app$#',
    ],

    'allowed_headers' => [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
        'X-CSRF-TOKEN',
    ],

    'exposed_headers' => [],

    'max_age' => 86400, // 24 hours — browsers cache preflight

    'supports_credentials' => true,
];
