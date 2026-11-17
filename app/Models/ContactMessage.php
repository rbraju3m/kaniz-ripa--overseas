<?php

namespace App\Models;

use App\Enums\ContactMessageStatus;
use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    protected $fillable = ['name', 'email', 'phone', 'subject', 'message', 'locale', 'ip', 'user_agent', 'status', 'read_at'];

    protected function casts(): array
    {
        return ['status' => ContactMessageStatus::class, 'read_at' => 'datetime'];
    }
}
