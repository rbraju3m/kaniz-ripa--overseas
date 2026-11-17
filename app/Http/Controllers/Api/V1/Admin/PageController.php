<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\PageRequest;
use App\Models\Page;

class PageController extends CrudController
{
    protected function modelClass(): string
    {
        return Page::class;
    }

    protected function module(): string
    {
        return 'pages';
    }

    protected function requestClass(): string
    {
        return PageRequest::class;
    }

    protected function relations(): array
    {
        return ['translations', 'cover', 'sections.translations'];
    }

    protected function searchColumns(): array
    {
        return ['title', 'body'];
    }
}
