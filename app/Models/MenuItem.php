<?php

namespace App\Models;

use App\Models\Concerns\LogsAdminActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItem extends Model
{
    use LogsAdminActivity;

    protected $fillable = ['menu_id', 'parent_id', 'label', 'route_name', 'url', 'open_in_new_tab', 'sort', 'is_active'];

    protected function casts(): array
    {
        return ['label' => 'array', 'open_in_new_tab' => 'boolean', 'is_active' => 'boolean', 'sort' => 'integer'];
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort');
    }
}
