<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Resources\Public\PageResource;
use App\Models\Page;

class PageController extends PublicController
{
    public function show(string $key): PageResource
    {
        $page = Page::query()
            ->published()
            ->hasReviewedTranslation()
            ->where('key', $key)
            ->with(['translations', 'cover', 'sections.translations', 'sections.media'])
            ->firstOrFail();

        return PageResource::make($page);
    }
}
