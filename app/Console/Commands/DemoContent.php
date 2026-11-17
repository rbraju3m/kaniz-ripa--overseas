<?php

namespace App\Console\Commands;

use App\Enums\PublishStatus;
use App\Models\Country;
use App\Models\Page;
use App\Models\SuccessStory;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * LOCAL PREVIEW ONLY. Fills the sections that have no real content yet (success stories,
 * mission, vision, values, why choose us) with clearly labelled sample content, so the
 * design can be reviewed. Refuses to run in production. `--remove` deletes exactly what
 * it added (marked with DEMO_MARKER) and puts the pages back to unpublished drafts.
 *
 * Never replace real company information with this: success stories must be real people
 * with written consent (see CLAUDE.md content rules).
 */
#[Signature('app:demo-content {--remove : Remove all demo content again}')]
#[Description('Add (or --remove) clearly labelled sample content for local design preview. Never runs in production.')]
class DemoContent extends Command
{
    public const DEMO_MARKER = 'demo-content';

    private const PAGE_KEYS = ['mission', 'vision', 'values', 'why_choose_us'];

    public function handle(): int
    {
        if (app()->isProduction()) {
            $this->error('Demo content is for local preview only and is never added in production.');

            return self::FAILURE;
        }

        return $this->option('remove') ? $this->remove() : $this->add();
    }

    private function add(): int
    {
        $admin = User::role(Permissions::SUPER_ADMIN)->where('is_active', true)->orderBy('id')->first();
        if ($admin) {
            Auth::setUser($admin);
        }

        DB::transaction(function () {
            $this->stories();
            $this->pages();
        });

        $this->info('Demo content added. Every item is labelled "Demo" / "Sample". Remove it with: php artisan app:demo-content --remove');

        return self::SUCCESS;
    }

    private function stories(): void
    {
        $country = fn (string $iso) => Country::query()->where('iso2', $iso)->value('id');

        $stories = [
            ['MY', true, [
                'en' => ['Sample story: factory work in Malaysia', 'Demo Candidate A', '<p>This is <strong>sample content</strong> for previewing the design. A real story would describe how the worker was selected, prepared and travelled, and how their work is going.</p>', 'Sample testimonial. Replace with the real words of a worker who has given written consent.'],
                'bn' => ['নমুনা গল্প: মালয়েশিয়ায় কারখানার কাজ', 'ডেমো প্রার্থী ক', '<p>এটি ডিজাইন দেখার জন্য <strong>নমুনা লেখা</strong>। প্রকৃত গল্পে কর্মী কীভাবে নির্বাচিত হয়েছেন, প্রস্তুতি নিয়েছেন ও বিদেশে গিয়েছেন এবং তাঁর কাজ কেমন চলছে তা থাকবে।</p>', 'নমুনা মন্তব্য। লিখিত সম্মতি দেওয়া প্রকৃত কর্মীর কথা দিয়ে এটি পরিবর্তন করুন।'],
            ]],
            ['SA', false, [
                'en' => ['Sample story: computer operator in Saudi Arabia', 'Demo Candidate B', '<p>This is <strong>sample content</strong> for previewing the design. Publish only real stories, with photos and written consent from the person featured.</p>', 'Sample testimonial for layout preview only.'],
                'bn' => ['নমুনা গল্প: সৌদি আরবে কম্পিউটার অপারেটর', 'ডেমো প্রার্থী খ', '<p>এটি ডিজাইন দেখার জন্য <strong>নমুনা লেখা</strong>। শুধুমাত্র প্রকৃত গল্প, ছবি ও সংশ্লিষ্ট ব্যক্তির লিখিত সম্মতিসহ প্রকাশ করুন।</p>', 'শুধুমাত্র ডিজাইন দেখার জন্য নমুনা মন্তব্য।'],
            ]],
            ['VN', false, [
                'en' => ['Sample story: construction work in Vietnam', 'Demo Candidate C', '<p>This is <strong>sample content</strong> for previewing the design. Replace it with a real story before the website goes live.</p>', 'Sample testimonial for layout preview only.'],
                'bn' => ['নমুনা গল্প: ভিয়েতনামে নির্মাণ কাজ', 'ডেমো প্রার্থী গ', '<p>এটি ডিজাইন দেখার জন্য <strong>নমুনা লেখা</strong>। ওয়েবসাইট চালুর আগে প্রকৃত গল্প দিয়ে এটি পরিবর্তন করুন।</p>', 'শুধুমাত্র ডিজাইন দেখার জন্য নমুনা মন্তব্য।'],
            ]],
        ];

        foreach ($stories as $i => [$iso, $featured, $t]) {
            $slug = 'demo-story-'.($i + 1);
            if (SuccessStory::query()->whereHas('translations', fn ($q) => $q->where('slug', $slug))->exists()) {
                continue;
            }
            $story = SuccessStory::query()->create([
                'country_id' => $country($iso),
                'is_featured' => $featured,
                'status' => PublishStatus::Published,
                'consent_confirmed_at' => now(),
                'consent_note' => strtoupper(self::DEMO_MARKER).': sample for local design preview, not a real person. Remove with php artisan app:demo-content --remove.',
                'sort' => 100 + $i,
            ]);
            $story->syncTranslations(collect($t)->map(fn ($v) => [
                'title' => $v[0], 'slug' => $slug, 'display_name' => $v[1], 'story' => $v[2], 'testimonial' => $v[3], 'is_reviewed' => true,
            ])->all());
        }
    }

    private function pages(): void
    {
        $marker = '<!-- '.self::DEMO_MARKER.' -->';
        $content = [
            'mission' => [
                'en' => ['Our Mission (sample)', '<p>Sample text: connect Bangladeshi workers with suitable employers abroad through clear, honest and well-coordinated recruitment.</p>'],
                'bn' => ['আমাদের লক্ষ্য (নমুনা)', '<p>নমুনা লেখা: স্বচ্ছ, সৎ ও সুসমন্বিত নিয়োগ প্রক্রিয়ার মাধ্যমে বাংলাদেশি কর্মীদের বিদেশের উপযুক্ত নিয়োগকর্তার সঙ্গে যুক্ত করা।</p>'],
            ],
            'vision' => [
                'en' => ['Our Vision (sample)', '<p>Sample text: to be a recruitment partner that employers and candidates can rely on.</p>'],
                'bn' => ['আমাদের ভিশন (নমুনা)', '<p>নমুনা লেখা: নিয়োগকর্তা ও প্রার্থী উভয়ের নির্ভরযোগ্য নিয়োগ সহযোগী হওয়া।</p>'],
            ],
            'values' => [
                'en' => ['Core Values (sample)', '<p>Sample text: honesty, transparency, respect and responsibility.</p>'],
                'bn' => ['মূল্যবোধ (নমুনা)', '<p>নমুনা লেখা: সততা, স্বচ্ছতা, সম্মান ও দায়িত্বশীলতা।</p>'],
            ],
            'why_choose_us' => [
                'en' => ['Why choose us (sample)', '<p>Sample text based on facts already on the website.</p>'],
                'bn' => ['কেন আমাদের বেছে নেবেন (নমুনা)', '<p>ওয়েবসাইটে থাকা তথ্যের ভিত্তিতে নমুনা লেখা।</p>'],
            ],
        ];
        $why = [
            ['direct', ['Direct contact with our team', 'আমাদের টিমের সাথে সরাসরি যোগাযোগ'], ['Call or WhatsApp the people who handle your recruitment.', 'যারা আপনার নিয়োগ দেখছেন তাদের সরাসরি কল বা হোয়াটসঅ্যাপ করুন।']],
            ['countries', ['Active in several countries', 'একাধিক দেশে কার্যক্রম'], ['Recruitment activities in Saudi Arabia, Malaysia and Vietnam.', 'সৌদি আরব, মালয়েশিয়া ও ভিয়েতনামে নিয়োগ কার্যক্রম।']],
            ['languages', ['Bangla and English', 'বাংলা ও ইংরেজি'], ['Clear communication with candidates and employers.', 'প্রার্থী ও নিয়োগকর্তার সাথে স্পষ্ট যোগাযোগ।']],
            ['office', ['Office in Banani, Dhaka', 'বনানী, ঢাকায় অফিস'], ['Visit us to discuss your requirements in person.', 'সরাসরি আলোচনার জন্য আমাদের অফিসে আসুন।']],
        ];

        foreach ($content as $key => $t) {
            $page = Page::query()->firstOrCreate(['key' => $key], ['status' => PublishStatus::Draft]);
            // Never overwrite a page that already has real, published content.
            if ($page->status === PublishStatus::Published && ! $page->translations()->where('body', 'like', '%'.self::DEMO_MARKER.'%')->exists()) {
                continue;
            }
            $slug = str_replace('_', '-', $key);
            $page->syncTranslations(collect($t)->map(fn ($v) => ['title' => $v[0], 'slug' => $slug, 'summary' => null, 'body' => $marker.$v[1], 'is_reviewed' => true])->all());

            if ($key === 'why_choose_us') {
                foreach ($why as $i => [$k, $title, $body]) {
                    $section = $page->sections()->firstOrCreate(['key' => 'demo-'.$k], ['sort' => $i, 'is_active' => true]);
                    $section->syncTranslations([
                        'en' => ['title' => $title[0], 'body' => $body[0], 'is_reviewed' => true],
                        'bn' => ['title' => $title[1], 'body' => $body[1], 'is_reviewed' => true],
                    ]);
                }
            }
            $page->update(['status' => PublishStatus::Published]);
        }
    }

    private function remove(): int
    {
        $stories = SuccessStory::query()->where('consent_note', 'like', strtoupper(self::DEMO_MARKER).'%')->get();
        $stories->each->delete();

        $pages = 0;
        foreach (Page::query()->whereIn('key', self::PAGE_KEYS)->get() as $page) {
            if (! $page->translations()->where('body', 'like', '%'.self::DEMO_MARKER.'%')->exists()) {
                continue; // edited by a person since: leave it alone
            }
            $page->sections()->where('key', 'like', 'demo-%')->get()->each->delete();
            $titles = $page->translations()->pluck('title', 'locale');
            $plain = fn (?string $title) => trim(str_replace([' (sample)', ' (নমুনা)'], '', (string) $title));
            $page->syncTranslations([
                'bn' => ['title' => $plain($titles['bn'] ?? null), 'body' => '[PLACEHOLDER] কোম্পানির অনুমোদিত লেখা প্রয়োজন।', 'is_reviewed' => false],
                'en' => ['title' => $plain($titles['en'] ?? null), 'body' => '[PLACEHOLDER] Approved company copy required.', 'is_reviewed' => false],
            ]);
            $page->update(['status' => PublishStatus::Draft]);
            $pages++;
        }

        $this->info("Removed {$stories->count()} demo success stories and reset {$pages} demo pages to unpublished drafts.");

        return self::SUCCESS;
    }
}
