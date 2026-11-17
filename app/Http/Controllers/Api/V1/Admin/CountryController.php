<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\CountryRequest;
use App\Models\Country;

class CountryController extends CrudController
{
    protected function modelClass(): string
    {
        return Country::class;
    }

    protected function module(): string
    {
        return 'countries';
    }

    protected function requestClass(): string
    {
        return CountryRequest::class;
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
