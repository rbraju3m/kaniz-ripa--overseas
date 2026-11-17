<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;

class Industry extends Model
{
    use HasTranslations, LogsAdminActivity;

    protected $fillable = ['key', 'sort'];
}
