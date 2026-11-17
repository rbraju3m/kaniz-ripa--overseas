<?php

namespace App\Models;

use App\Enums\ProfileSource;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyProfileVersion extends Model
{
    protected $fillable = [
        'company_profile_id', 'source', 'locale', 'disk', 'path', 'original_name',
        'size', 'version_no', 'is_current', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'source' => ProfileSource::class,
            'is_current' => 'boolean',
            'size' => 'integer',
            'version_no' => 'integer',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(CompanyProfile::class, 'company_profile_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
