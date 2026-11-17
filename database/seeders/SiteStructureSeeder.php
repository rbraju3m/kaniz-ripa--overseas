<?php

namespace Database\Seeders;

use App\Enums\ProfileSource;
use App\Enums\PublishStatus;
use App\Models\CompanyProfile;
use App\Models\Menu;
use App\Models\Page;
use App\Models\Service;
use Illuminate\Database\Seeder;

/**
 * Structural records (pages, services, menus, profile). All copy is a flagged
 * [PLACEHOLDER] draft that is NOT reviewed, so nothing here is publicly visible
 * until the client supplies and approves real content.
 */
class SiteStructureSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            'home_intro' => ['কোম্পানি পরিচিতি', 'Company Introduction'],
            'about' => ['আমাদের সম্পর্কে', 'About Us'],
            'history' => ['আমাদের ইতিহাস', 'Our History'],
            'mission' => ['আমাদের লক্ষ্য', 'Our Mission'],
            'vision' => ['আমাদের ভিশন', 'Our Vision'],
            'values' => ['মূল্যবোধ', 'Core Values'],
            'management' => ['ব্যবস্থাপনা', 'Management'],
            'credentials' => ['প্রতিষ্ঠানের সনদ', 'Company Credentials'],
            'why_choose_us' => ['কেন আমাদের বেছে নেবেন', 'Why Choose Us'],
            'privacy' => ['গোপনীয়তা নীতি', 'Privacy Policy'],
        ];

        foreach ($pages as $key => [$bn, $en]) {
            $page = Page::query()->firstOrCreate(['key' => $key], ['status' => PublishStatus::Draft]);
            if ($page->translations()->exists()) {
                continue;
            }
            $slug = str_replace('_', '-', $key);
            $page->syncTranslations([
                'bn' => ['title' => $bn, 'slug' => $slug, 'body' => '[PLACEHOLDER] কোম্পানির অনুমোদিত লেখা প্রয়োজন।', 'is_reviewed' => false],
                'en' => ['title' => $en, 'slug' => $slug, 'body' => '[PLACEHOLDER] Approved company copy required.', 'is_reviewed' => false],
            ]);
        }

        // Services suggested in the brief — publish only after the company confirms them.
        $services = [
            ['globe', 'বিদেশে জনশক্তি নিয়োগ', 'Overseas Manpower Recruitment', 'overseas-manpower-recruitment'],
            ['handshake', 'আন্তর্জাতিক নিয়োগ সমন্বয়', 'International Recruitment Coordination', 'international-recruitment-coordination'],
            ['users', 'প্রার্থী সংগ্রহ', 'Candidate Sourcing', 'candidate-sourcing'],
            ['file-check', 'ডকুমেন্টেশন সহায়তা', 'Documentation Assistance', 'documentation-assistance'],
            ['message-square', 'নিয়োগ পরামর্শ', 'Recruitment Consultation', 'recruitment-consultation'],
        ];

        foreach ($services as $i => [$icon, $bn, $en, $slug]) {
            if (Service::query()->whereHas('translations', fn ($q) => $q->where('slug', $slug))->exists()) {
                continue;
            }
            $service = Service::query()->create(['icon' => $icon, 'status' => PublishStatus::Draft, 'sort' => $i]);
            $service->syncTranslations([
                'bn' => ['title' => $bn, 'slug' => $slug, 'summary' => '[PLACEHOLDER] সেবার বিবরণ প্রয়োজন।', 'is_reviewed' => false],
                'en' => ['title' => $en, 'slug' => $slug, 'summary' => '[PLACEHOLDER] Service description required.', 'is_reviewed' => false],
            ]);
        }

        $menus = [
            'header' => [
                ['home', 'হোম', 'Home'],
                ['about', 'আমাদের সম্পর্কে', 'About Us'],
                ['services', 'সেবাসমূহ', 'Services'],
                ['portfolio', 'পোর্টফোলিও', 'Portfolio'],
                ['partners', 'অংশীদার', 'Partners'],
                ['success-stories', 'সাফল্যের গল্প', 'Success Stories'],
                ['gallery', 'গ্যালারি', 'Gallery'],
                ['contact', 'যোগাযোগ', 'Contact'],
            ],
            'footer' => [
                ['about', 'আমাদের সম্পর্কে', 'About Us'],
                ['services', 'সেবাসমূহ', 'Services'],
                ['portfolio', 'পোর্টফোলিও', 'Portfolio'],
                ['company-profile', 'কোম্পানি প্রোফাইল', 'Company Profile'],
                ['contact', 'যোগাযোগ', 'Contact'],
            ],
        ];

        foreach ($menus as $location => $items) {
            $menu = Menu::query()->firstOrCreate(['location' => $location], ['name' => ucfirst($location)]);
            if ($menu->items()->exists()) {
                continue;
            }
            foreach ($items as $i => [$route, $bn, $en]) {
                $menu->items()->create(['route_name' => $route, 'label' => ['bn' => $bn, 'en' => $en], 'sort' => $i]);
            }
        }

        CompanyProfile::query()->firstOrCreate([], [
            'active_source' => ProfileSource::Generated,
            'status' => PublishStatus::Published,
            'title' => ['bn' => 'কোম্পানি প্রোফাইল', 'en' => 'Company Profile'],
            'description' => ['bn' => null, 'en' => null],
        ]);
    }
}
