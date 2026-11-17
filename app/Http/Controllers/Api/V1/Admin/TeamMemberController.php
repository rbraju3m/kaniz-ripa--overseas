<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Requests\Admin\TeamMemberRequest;
use App\Models\TeamMember;

class TeamMemberController extends CrudController
{
    protected function modelClass(): string
    {
        return TeamMember::class;
    }

    protected function module(): string
    {
        return 'team';
    }

    protected function requestClass(): string
    {
        return TeamMemberRequest::class;
    }

    protected function relations(): array
    {
        return ['translations', 'photo'];
    }

    protected function searchColumns(): array
    {
        return ['name', 'role'];
    }
}
