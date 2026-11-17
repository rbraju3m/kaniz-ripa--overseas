<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Resources\Public\TeamMemberResource;
use App\Models\TeamMember;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TeamController extends PublicController
{
    public function index(): AnonymousResourceCollection
    {
        return TeamMemberResource::collection(self::members());
    }

    /** @return Collection<int, TeamMember> */
    public static function members(): Collection
    {
        return TeamMember::query()->published()->hasReviewedTranslation()
            ->with(['translations', 'photo'])->orderBy('sort')->orderBy('id')->get();
    }
}
