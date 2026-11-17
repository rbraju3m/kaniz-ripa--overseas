<?php

namespace Database\Seeders;

use App\Enums\PublishStatus;
use App\Models\Portfolio;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Auth;

/**
 * Publishes the five portfolio drafts created by PosterContentSeeder (real data from the
 * official recruitment posters), with both translations marked reviewed by the Super Admin.
 *
 * Not part of DatabaseSeeder: publishing is an explicit owner decision. Run it with
 *   php artisan db:seed --class=PublishPosterPortfoliosSeeder --force
 *
 * Companies are NOT verified here, so they are still not shown as partners: the
 * portfolio shows the employer name from the poster only.
 */
class PublishPosterPortfoliosSeeder extends Seeder
{
    /** BN slugs of the poster portfolios (see PosterContentSeeder). */
    public const SLUGS = [
        'vital-healthcare-malaysia-factory-workers',
        'dai-suwon-packaging-malaysia-carton-factory-workers',
        'jubaid-al-khair-saudi-computer-operator',
        'jusur-almawared-saudi-multiple-positions',
        'vietnam-industrial-workers',
    ];

    public function run(): void
    {
        $this->call(PosterContentSeeder::class);

        $reviewer = User::role(Permissions::SUPER_ADMIN)->where('is_active', true)->orderBy('id')->first();
        if (! $reviewer) {
            $this->command?->error('No active Super Admin to record as reviewer. Run php artisan app:ensure-super-admin first.');

            return;
        }

        // Reviews and the activity log are attributed to the Super Admin.
        Auth::setUser($reviewer);

        $portfolios = Portfolio::query()
            ->whereHas('translations', fn ($q) => $q->whereIn('slug', self::SLUGS))
            ->with('translations')
            ->get();

        foreach ($portfolios as $portfolio) {
            $portfolio->syncTranslations($portfolio->translations->mapWithKeys(fn ($t) => [
                $t->locale => ['is_reviewed' => true],
            ])->all());

            if ($portfolio->status !== PublishStatus::Published) {
                $portfolio->update(['status' => PublishStatus::Published]);
            }
        }

        $this->command?->info("Published {$portfolios->count()} poster portfolio item(s).");
    }
}
