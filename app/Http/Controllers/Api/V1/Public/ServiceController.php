<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Resources\Public\ServiceResource;
use App\Models\Service;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ServiceController extends PublicController
{
    public function index(): AnonymousResourceCollection
    {
        $services = Service::query()->published()->hasReviewedTranslation()
            ->with(['translations', 'image'])->orderBy('sort')->get();

        return ServiceResource::collection($services);
    }

    public function show(string $slug): ServiceResource
    {
        $query = Service::query()->published()->with(['translations', 'image']);

        return ServiceResource::make($this->findBySlug($query, $slug));
    }
}
