<?php

namespace App\Enums;

enum Locale: string
{
    case Bn = 'bn';
    case En = 'en';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /** Locale used when the requested one has no reviewed translation. */
    public static function fallback(): self
    {
        return self::En;
    }

    public static function fromRequestValue(?string $value): self
    {
        return self::tryFrom((string) $value) ?? self::Bn;
    }
}
