<?php

beforeEach(fn () => actingAsRole());

function storyPayload(array $o = []): array
{
    return array_replace_recursive([
        'status' => 'draft',
        'translations' => ['en' => ['title' => 'From Dhaka to KL', 'slug' => 'dhaka-to-kl', 'display_name' => 'M. Hossain', 'testimonial' => 'Thank you', 'is_reviewed' => true]],
    ], $o);
}

it('creates a draft story without consent', function () {
    $this->postJson('/api/v1/admin/success-stories', storyPayload())->assertCreated();
});

it('refuses to publish without recorded consent', function () {
    $this->postJson('/api/v1/admin/success-stories', storyPayload(['status' => 'published']))
        ->assertStatus(422)->assertJsonValidationErrors('consent_confirmed');
});

it('publishes with consent and records who confirmed it', function () {
    $res = $this->postJson('/api/v1/admin/success-stories', storyPayload([
        'status' => 'published', 'consent_confirmed' => true, 'consent_note' => 'Signed form on file, 2026-11-01',
    ]))->assertCreated();

    expect($res->json('data.consent_confirmed_at'))->not->toBeNull()
        ->and($res->json('data.consent_confirmed_by'))->not->toBeNull();

    $this->getJson('/api/v1/success-stories')->assertOk()->assertJsonCount(1, 'data');
});

it('only accepts known video hosts', function () {
    $this->postJson('/api/v1/admin/success-stories', storyPayload(['video_url' => 'https://evil.example/x.mp4']))
        ->assertStatus(422)->assertJsonValidationErrors('video_url');
    $this->postJson('/api/v1/admin/success-stories', storyPayload(['video_url' => 'https://www.youtube.com/watch?v=abc']))
        ->assertCreated();
});
