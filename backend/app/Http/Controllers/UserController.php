<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function index()
    {
        // Return all users except owner
        $users = User::where('role', '!=', 'owner')->get();

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($users)
        ]);
    }

    public function show($id)
    {
        $user = User::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new UserResource($user)
        ]);
    }

    public function search(Request $request)
    {
        $query = $request->input('q', '');
        
        $users = User::where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('username', 'LIKE', "%{$query}%");
            })
            ->where('role', '!=', 'owner')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($users)
        ]);
    }

    public function update(UpdateProfileRequest $request, $id)
    {
        $user = User::findOrFail($id);

        $data = ['name' => $request->name];

        if ($request->password) {
            $data['password'] = Hash::make($request->password);
        }

        if ($request->hasFile('profile_picture')) {
            // Delete old profile picture if exists
            if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
                Storage::disk('public')->delete($user->profile_picture);
            }

            // Store new profile picture
            $path = $request->file('profile_picture')->store('profiles', 'public');
            $data['profile_picture'] = $path;
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data' => new UserResource($user->refresh())
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if ($user->role === 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus akun pemilik'
            ], 403);
        }

        // Delete profile picture if exists
        if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }

        // Revoke all tokens before deletion
        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dihapus'
        ]);
    }
}