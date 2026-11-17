<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

/**
 * Secure image handling: every upload is decoded and RE-ENCODED to WebP
 * (stripping metadata and any embedded payload), stored under a random name,
 * and given responsive variants. SVG is never accepted.
 */
class MediaService
{
    public const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    public const MAX_DIMENSION = 2400;

    /** variant name => max width */
    public const VARIANTS = ['sm' => 480, 'md' => 960, 'lg' => 1600];

    public function storeImage(UploadedFile $file, string $folder = 'general', array $alt = [], ?int $userId = null): Media
    {
        $manager = new ImageManager(new Driver);
        $image = $manager->decodePath($file->getRealPath());
        $image->scaleDown(self::MAX_DIMENSION, self::MAX_DIMENSION);

        $folder = Str::slug($folder) ?: 'general';
        $base = "media/{$folder}/".now()->format('Y/m').'/'.Str::uuid();
        $disk = Storage::disk('public');

        $disk->put("{$base}.webp", $image->encode(new WebpEncoder(quality: 82, strip: true))->toString());

        $variants = [];
        foreach (self::VARIANTS as $name => $width) {
            if ($image->width() <= $width) {
                continue;
            }
            $variant = (clone $image)->scaleDown($width);
            $disk->put("{$base}-{$name}.webp", $variant->encode(new WebpEncoder(quality: 80, strip: true))->toString());
            $variants[$name] = "{$base}-{$name}.webp";
        }

        return Media::query()->create([
            'disk' => 'public',
            'path' => "{$base}.webp",
            'original_name' => Str::limit($file->getClientOriginalName(), 250, ''),
            'mime' => 'image/webp',
            'size' => $disk->size("{$base}.webp"),
            'width' => $image->width(),
            'height' => $image->height(),
            'variants' => $variants,
            'alt' => array_filter(['bn' => $alt['bn'] ?? null, 'en' => $alt['en'] ?? null]),
            'folder' => $folder,
            'uploaded_by' => $userId,
        ]);
    }

    public function delete(Media $media): void
    {
        $disk = Storage::disk($media->disk);
        $disk->delete(array_values([$media->path, ...array_values($media->variants ?? [])]));
        $media->delete();
    }
}
