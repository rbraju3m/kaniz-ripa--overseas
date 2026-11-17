<?php

use App\Models\GalleryCategory;
use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    actingAsRole();
});

it('uploads an image, re-encodes it to webp and creates variants', function () {
    $file = UploadedFile::fake()->image('office.jpg', 2000, 1200);

    $res = $this->postJson('/api/v1/admin/media', ['file' => $file, 'folder' => 'gallery', 'alt' => ['en' => 'Office']])
        ->assertCreated()
        ->assertJsonPath('data.mime', 'image/webp');

    $media = Media::query()->findOrFail($res->json('data.id'));
    Storage::disk('public')->assertExists($media->path);
    expect($media->path)->toEndWith('.webp')
        ->and($media->path)->not->toContain('office')
        ->and(array_keys($media->variants))->toEqualCanonicalizing(['sm', 'md', 'lg']);
});

it('lists media with image urls for the library grid', function () {
    $this->postJson('/api/v1/admin/media', ['file' => UploadedFile::fake()->image('team.jpg', 2000, 1200), 'folder' => 'pages'])->assertCreated();

    $item = $this->getJson('/api/v1/admin/media')->assertOk()->assertJsonPath('meta.total', 1)->json('data.0');

    expect($item['url'])->toContain('/storage/media/pages/')
        ->and($item['variant_urls'])->toHaveKeys(['sm', 'md']);
});

it('rejects svg, html and disguised files', function () {
    $svg = UploadedFile::fake()->createWithContent('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    $html = UploadedFile::fake()->createWithContent('x.jpg', '<html><script>alert(1)</script></html>');
    $php = UploadedFile::fake()->createWithContent('shell.php.png', '<?php system($_GET["c"]);');

    foreach ([$svg, $html, $php] as $file) {
        $this->postJson('/api/v1/admin/media', ['file' => $file])->assertStatus(422)->assertJsonValidationErrors('file');
    }
    expect(Media::query()->count())->toBe(0);
});

it('deletes media files from disk', function () {
    $id = $this->postJson('/api/v1/admin/media', ['file' => UploadedFile::fake()->image('a.png', 600, 400)])->json('data.id');
    $media = Media::query()->find($id);

    $this->deleteJson("/api/v1/admin/media/{$id}")->assertNoContent();
    Storage::disk('public')->assertMissing($media->path);
});

it('manages gallery categories and items with public filtering', function () {
    $catId = $this->postJson('/api/v1/admin/gallery-categories', [
        'slug' => 'events', 'translations' => ['en' => ['name' => 'Events', 'is_reviewed' => true]],
    ])->assertCreated()->json('data.id');

    $mediaId = $this->postJson('/api/v1/admin/media', ['file' => UploadedFile::fake()->image('e.jpg', 800, 600)])->json('data.id');

    $this->postJson('/api/v1/admin/gallery-items', ['type' => 'image', 'media_id' => $mediaId, 'gallery_category_id' => $catId, 'status' => 'published'])->assertCreated();
    $this->postJson('/api/v1/admin/gallery-items', ['type' => 'video', 'video_url' => 'https://youtu.be/abc', 'status' => 'draft'])->assertCreated();
    $this->postJson('/api/v1/admin/gallery-items', ['type' => 'image'])->assertStatus(422)->assertJsonValidationErrors('media_id');

    $this->getJson('/api/v1/gallery')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/gallery?category=events')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/gallery?category=other')->assertOk()->assertJsonCount(0, 'data');
    $this->getJson('/api/v1/gallery/categories')->assertOk()->assertJsonPath('data.0.slug', 'events');

    expect(GalleryCategory::query()->count())->toBe(1);
});
