<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\ServiceRequest;
use App\Models\Service;

class ServiceController extends CrudController
{
    protected function modelClass(): string
    {
        return Service::class;
    }

    protected function module(): string
    {
        return 'services';
    }

    protected function requestClass(): string
    {
        return ServiceRequest::class;
    }

    protected function relations(): array
    {
        return ['translations', 'image'];
    }

    protected function searchColumns(): array
    {
        return ['title', 'summary'];
    }
}
