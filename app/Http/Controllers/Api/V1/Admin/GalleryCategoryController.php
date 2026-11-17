<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\GalleryCategoryRequest;
use App\Models\GalleryCategory;

class GalleryCategoryController extends CrudController
{
    protected function modelClass(): string
    {
        return GalleryCategory::class;
    }

    protected function module(): string
    {
        return 'gallery';
    }

    protected function requestClass(): string
    {
        return GalleryCategoryRequest::class;
    }

    protected function relations(): array
    {
        return ['translations'];
    }

    protected function searchColumns(): array
    {
        return ['name'];
    }
}
