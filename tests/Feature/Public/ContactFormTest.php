<?php

use App\Models\ContactMessage;

it('stores a valid contact message', function () {
    $this->postJson('/api/v1/contact?locale=bn', [
        'name' => 'রহিম', 'phone' => '01700000000', 'message' => 'আমি আপনাদের সেবা সম্পর্কে জানতে চাই।',
    ])->assertCreated();

    expect(ContactMessage::query()->first())
        ->locale->toBe('bn')
        ->status->value->toBe('new');
});

it('requires email or phone and a message', function () {
    $this->postJson('/api/v1/contact', ['name' => 'X'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'phone', 'message']);
});

it('rejects bots filling the honeypot', function () {
    $this->postJson('/api/v1/contact', [
        'name' => 'Bot', 'email' => 'bot@example.com', 'message' => 'Buy cheap stuff now!!!', 'website' => 'http://spam',
    ])->assertStatus(422);
    expect(ContactMessage::query()->count())->toBe(0);
});

it('rate limits submissions', function () {
    $payload = ['name' => 'Karim', 'email' => 'k@example.com', 'message' => 'Hello there, please call me.'];
    foreach (range(1, 3) as $_) {
        $this->postJson('/api/v1/contact', $payload)->assertCreated();
    }
    $this->postJson('/api/v1/contact', $payload)->assertStatus(429);
});

it('lets admins read and archive messages', function () {
    $msg = ContactMessage::query()->create(['name' => 'A', 'email' => 'a@example.com', 'message' => 'Hello world message', 'status' => 'new']);
    actingAsRole('editor');

    $this->getJson("/api/v1/admin/contact-messages/{$msg->id}")->assertOk()->assertJsonPath('data.status', 'read');
    $this->putJson("/api/v1/admin/contact-messages/{$msg->id}", ['status' => 'archived'])->assertOk();
    $this->deleteJson("/api/v1/admin/contact-messages/{$msg->id}")->assertForbidden();
});
