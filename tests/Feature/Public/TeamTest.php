<?php

use App\Models\TeamMember;

function teamMember(array $attrs = [], bool $reviewed = true): TeamMember
{
    $m = TeamMember::query()->create($attrs + ['phone' => '01700000000', 'whatsapp' => true, 'status' => 'published']);
    $m->syncTranslations([
        'en' => ['name' => 'Test Person', 'role' => 'Manager', 'is_reviewed' => $reviewed],
        'bn' => ['name' => 'টেস্ট', 'role' => 'ম্যানেজার', 'is_reviewed' => $reviewed],
    ]);

    return $m;
}

it('lists only published team members with reviewed names', function () {
    teamMember();
    teamMember(['status' => 'draft']);
    teamMember(reviewed: false);

    $this->getJson('/api/v1/team?locale=bn')->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'টেস্ট')
        ->assertJsonPath('data.0.whatsapp', true);
});

it('hides the number when the member chooses not to show it', function () {
    teamMember(['show_phone' => false]);

    $this->getJson('/api/v1/team?locale=en')->assertJsonPath('data.0.phone', null)->assertJsonPath('data.0.whatsapp', false);
});

it('includes the team and real counts on the home page', function () {
    teamMember();

    $this->getJson('/api/v1/home?locale=en')->assertOk()
        ->assertJsonCount(1, 'data.team')
        ->assertJsonPath('data.stats.projects', 0)
        ->assertJsonPath('data.stats.partners', 0);
});

it('lets admins manage team members with the team permission', function () {
    actingAsRole('editor');

    $id = $this->postJson('/api/v1/admin/team-members', [
        'phone' => '01711111111',
        'translations' => ['en' => ['name' => 'New Member', 'role' => 'Officer', 'is_reviewed' => true]],
    ])->assertCreated()->json('data.id');

    // Editors cannot publish.
    $this->putJson("/api/v1/admin/team-members/{$id}", [
        'status' => 'published',
        'translations' => ['en' => ['name' => 'New Member', 'is_reviewed' => true]],
    ])->assertForbidden();

    actingAsRole('viewer');
    $this->postJson('/api/v1/admin/team-members', ['translations' => ['en' => ['name' => 'X']]])->assertForbidden();
});
