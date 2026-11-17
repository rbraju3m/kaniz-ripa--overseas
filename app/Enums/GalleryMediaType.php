<?php

namespace App\Enums;

enum GalleryMediaType: string
{
    case Image = 'image';
    case Video = 'video';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
