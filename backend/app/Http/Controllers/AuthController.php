<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Notification;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $user = User::where('username', $request->username)->first();

        // Always run Hash::check to prevent timing attacks
        $passwordValid = $user && Hash::check($request->password, $user->password);

        if (!$passwordValid) {
            // FIX L1: Log failed login attempts
            Log::warning('Failed login attempt', [
                'username' => $request->username,
                'ip'       => $request->ip(),
            ]);
            throw ValidationException::withMessages([
                'username' => ['Username atau password salah'],
            ]);
        }

        if (!$user->is_approved) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda menunggu persetujuan Owner.'
            ], 403);
        }

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('auth_token')->plainTextToken;

        // FIX L1: Log successful login
        Log::info('User logged in', [
            'user_id'  => $user->id,
            'username' => $user->username,
            'role'     => $user->role,
            'ip'       => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => new UserResource($user),
            ]
        ]);
    }

    public function register(RegisterRequest $request)
    {
        // FIX E4: Role sudah divalidasi di RegisterRequest (hanya 'admin' atau 'staff')
        // Default ke 'staff' jika tidak disertakan
        $role = $request->role ?? 'staff';
        // Extra safety: pastikan owner tidak bisa dibuat via API
        if (!in_array($role, ['admin', 'staff'])) {
            $role = 'staff';
        }
        $isApproved = $role === 'staff';

        $user = User::create([
            'username'    => $request->username,
            'password'    => Hash::make($request->password),
            'name'        => $request->name,
            'role'        => $role,
            'is_approved' => $isApproved,
        ]);

        // FIX L1: Log registration
        Log::info('New user registered', [
            'user_id'     => $user->id,
            'username'    => $user->username,
            'role'        => $user->role,
            'is_approved' => $user->is_approved,
            'ip'          => $request->ip(),
        ]);

        // Notify owners about admin approval requests
        if (!$isApproved) {
            $owners = User::where('role', 'owner')->get();
            foreach ($owners as $owner) {
                Notification::create([
                    'user_id'    => $owner->id,
                    'type'       => 'approval',
                    'title'      => 'Permintaan Persetujuan Admin Baru',
                    'message'    => "Pengguna {$user->name} ({$user->username}) meminta persetujuan sebagai admin.",
                    'data'       => ['user_id' => $user->id],
                    'action_url' => '/approvals',
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => $isApproved
                ? 'Registrasi berhasil'
                : 'Registrasi berhasil. Menunggu persetujuan Owner.',
            'data' => new UserResource($user),
        ], 201);
    }

    public function logout(Request $request)
    {
        // FIX L1: Log logout
        Log::info('User logged out', [
            'user_id'  => $request->user()->id,
            'username' => $request->user()->username,
        ]);

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil logout',
        ]);
    }

    public function getCurrentUser(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => new UserResource($request->user()),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name'            => 'required|string|min:2|max:100',
            'profile_picture' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
        ]);

        $user = $request->user();
        $data = ['name' => $request->name];

        if ($request->hasFile('profile_picture')) {
            if ($user->profile_picture && \Storage::disk('public')->exists($user->profile_picture)) {
                \Storage::disk('public')->delete($user->profile_picture);
            }
            $data['profile_picture'] = $request->file('profile_picture')->store('profiles', 'public');
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data'    => new UserResource($user->refresh()),
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed', // FIX S6: min 8 karakter
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password lama tidak cocok',
            ], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        // FIX L1: Log password change
        Log::info('User changed password', [
            'user_id'  => $user->id,
            'username' => $user->username,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah',
        ]);
    }
}
