<?php

namespace App\Enums;

enum ProfileSource: string
{
    case Uploaded = 'uploaded';
    case Generated = 'generated';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
