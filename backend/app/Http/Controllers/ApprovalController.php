<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Notification;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ApprovalController extends Controller
{
    public function index()
    {
        // Get all users with role 'admin' who are NOT approved
        $pendingUsers = User::where('role', 'admin')
            ->where('is_approved', false)
            ->get();

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($pendingUsers)
        ]);
    }

    public function approve($id)
    {
        $user = User::findOrFail($id);

        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pengguna admin yang dapat disetujui'
            ], 400);
        }

        if ($user->is_approved) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna sudah disetujui sebelumnya'
            ], 400);
        }

        $user->is_approved = true;
        $user->save();

        // FIX L1: Log approval action
        Log::info('Admin user approved', [
            'approved_user_id' => $user->id,
            'approved_by'      => request()->user()->id,
        ]);

        // Notify the approved user
        Notification::create([
            'user_id' => $user->id,
            'type' => 'system',
            'title' => 'Akun Disetujui',
            'message' => 'Akun admin Anda telah disetujui. Anda sekarang dapat login.',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil disetujui',
            'data' => new UserResource($user)
        ]);
    }

    public function reject($id)
    {
        $user = User::findOrFail($id);

        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pengguna admin yang dapat ditolak'
            ], 400);
        }

        // Revoke tokens before deletion
        $user->tokens()->delete();
        $user->delete();

        // FIX L1: Log rejection action
        Log::info('Admin user rejected and deleted', [
            'rejected_user_id'       => $user->id,
            'rejected_user_username' => $user->username,
            'rejected_by'            => request()->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengguna ditolak dan dihapus'
        ]);
    }
}
