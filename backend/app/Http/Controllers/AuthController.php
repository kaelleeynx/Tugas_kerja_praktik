<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Notification;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
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
        $role = $request->role ?? 'staff';
        $isApproved = $role === 'staff';

        $user = User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'name' => $request->name,
            'role' => $role,
            'is_approved' => $isApproved
        ]);

        // Notify owners about admin approval requests
        if (!$isApproved) {
            $owners = User::where('role', 'owner')->get();
            foreach ($owners as $owner) {
                Notification::create([
                    'user_id' => $owner->id,
                    'type' => 'approval',
                    'title' => 'Permintaan Persetujuan Admin Baru',
                    'message' => "Pengguna {$user->name} ({$user->username}) meminta persetujuan sebagai admin.",
                    'data' => ['user_id' => $user->id],
                    'action_url' => '/approvals'
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
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil logout'
        ]);
    }

    public function getCurrentUser(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($request->user()),
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
            'data' => new UserResource($user->refresh()),
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password lama tidak cocok',
            ], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah',
        ]);
    }
}