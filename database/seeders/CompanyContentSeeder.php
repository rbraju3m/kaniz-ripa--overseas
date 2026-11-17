<?php

namespace Database\Seeders;

use App\Enums\PublishStatus;
use App\Enums\VerificationStatus;
use App\Models\Company;
use App\Models\Page;
use App\Models\Service;
use App\Models\Setting;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\SettingsService;
use App\Support\Permissions;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Auth;

/**
 * Publishes the About page, the team (from the contact persons on the official posters),
 * the services and the four partner companies, as approved by the company's Super Admin.
 *
 * Every statement is limited to facts from the official posters: no founding year,
 * licence number, statistics or testimonials are added. Missing items stay tracked
 * in docs/MISSING-INFO.md.
 *
 * Not part of DatabaseSeeder (publishing is an explicit owner decision):
 *   php artisan db:seed --class=CompanyContentSeeder --force
 */
class CompanyContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([SiteStructureSeeder::class, PublishPosterPortfoliosSeeder::class]);

        $reviewer = User::role(Permissions::SUPER_ADMIN)->where('is_active', true)->orderBy('id')->first();
        if (! $reviewer) {
            $this->command?->error('No active Super Admin to record as reviewer. Run php artisan app:ensure-super-admin first.');

            return;
        }
        Auth::setUser($reviewer);

        $this->about();
        $this->team();
        $this->services();
        $this->partners();
        $this->showContactPersons();

        $this->command?->info('About, team, services and partners published.');
    }

    private function about(): void
    {
        $this->publishPage('about', [
            'bn' => [
                'title' => 'আমাদের সম্পর্কে',
                'summary' => 'ঢাকার বনানীতে অবস্থিত একটি বৈদেশিক কর্মসংস্থান প্রতিষ্ঠান, যা বিদেশি নিয়োগকর্তাদের সাথে বাংলাদেশি কর্মীদের সংযোগ ঘটায়।',
                'body' => '<p>কানিজ রিপা ওভারসিজ ঢাকার বনানীতে অবস্থিত একটি বৈদেশিক কর্মসংস্থান (রিক্রুটিং) প্রতিষ্ঠান। আমরা বিদেশি নিয়োগকর্তাদের জন্য বাংলাদেশি কর্মী নিয়োগ করি এবং নিয়োগকর্তা ও প্রার্থীদের মধ্যে পুরো নিয়োগ প্রক্রিয়া সমন্বয় করি।</p>'
                    .'<p>বর্তমানে আমাদের নিয়োগ কার্যক্রম চলছে সৌদি আরব, মালয়েশিয়া ও ভিয়েতনামে: মেডিকেল ইকুইপমেন্ট ও কার্টন উৎপাদন, অফিস প্রশাসন, ড্রাইভিং, পরিচ্ছন্নতা ও ভবন রক্ষণাবেক্ষণ, ফার্নিচার, প্লাস্টিক, নির্মাণ এবং গার্মেন্টস খাতে।</p>'
                    .'<p>নিয়োগ সংক্রান্ত যেকোনো তথ্যের জন্য বনানী অফিসে আমাদের টিমের সাথে সরাসরি যোগাযোগ করুন।</p>',
            ],
            'en' => [
                'title' => 'About Us',
                'summary' => 'An overseas recruitment agency in Banani, Dhaka, connecting Bangladeshi workers with employers abroad.',
                'body' => '<p>KANIZ RIPA OVERSEAS is an overseas recruitment agency based in Banani, Dhaka. We recruit Bangladeshi workers for employers abroad and coordinate the recruitment process between employers and candidates.</p>'
                    .'<p>Our current recruitment activities cover Saudi Arabia, Malaysia and Vietnam, across medical equipment and carton manufacturing, office administration, driving, cleaning and building maintenance, furniture, plastics, construction and garments.</p>'
                    .'<p>For any recruitment enquiry, contact our team directly at our Banani office.</p>',
            ],
        ]);
    }

    /** The contact persons from the official posters become Team members (photos are added in the CMS). */
    private function team(): void
    {
        // Heading and intro for the team section on the About page.
        $page = $this->publishPage('management', [
            'bn' => ['title' => 'আমাদের টিম', 'summary' => 'বনানী অফিসে যাদের সাথে আপনি সরাসরি যোগাযোগ করতে পারেন।', 'body' => null],
            'en' => ['title' => 'Our Team', 'summary' => 'The people you can contact directly at our Banani office.', 'body' => null],
        ]);
        // Earlier versions stored the team as page items; Team members replace them.
        $page->sections()->where('key', 'like', 'member-%')->get()->each->delete();

        $people = (array) (Setting::query()->where('key', 'mobiles')->first()?->value['v'] ?? []);

        foreach (array_values($people) as $i => $person) {
            $member = TeamMember::query()->firstOrNew(['phone' => (string) $person['number']]);
            $member->fill([
                'show_phone' => true,
                'whatsapp' => (bool) ($person['whatsapp'] ?? false),
                'status' => PublishStatus::Published,
                'sort' => $member->exists ? $member->sort : $i,
            ])->save();

            $member->syncTranslations(collect(['bn', 'en'])->mapWithKeys(fn ($l) => [$l => [
                'name' => $person['name'][$l] ?? $person['name']['en'],
                'role' => $person['role'][$l] ?? $person['role']['en'],
                'is_reviewed' => true,
            ]])->all());
        }
    }

    private function services(): void
    {
        $services = [
            'overseas-manpower-recruitment' => [
                'বিদেশি নিয়োগকর্তাদের জন্য বাংলাদেশি কর্মী নিয়োগ, বর্তমানে সৌদি আরব, মালয়েশিয়া ও ভিয়েতনামে।',
                'Recruitment of Bangladeshi workers for employers abroad, currently in Saudi Arabia, Malaysia and Vietnam.',
            ],
            'international-recruitment-coordination' => [
                'বিদেশি নিয়োগকর্তা ও প্রার্থীদের মধ্যে নিয়োগ কার্যক্রম সমন্বয়, নিয়োগকর্তা ও ডেলিগেট ইন্টারভিউ সহ।',
                'Coordinating each recruitment between the overseas employer and candidates, including employer and delegate interviews.',
            ],
            'candidate-sourcing' => [
                'প্রতিটি নিয়োগকর্তার পদ ও দক্ষতার চাহিদা অনুযায়ী উপযুক্ত প্রার্থী খোঁজা ও বাছাই।',
                "Finding and shortlisting candidates who match each employer's position and skill requirements.",
            ],
            'documentation-assistance' => [
                'বিদেশে কর্মসংস্থানের জন্য প্রয়োজনীয় কাগজপত্র প্রস্তুতে সহায়তা ও নির্দেশনা।',
                'Guidance with the documents required for overseas employment.',
            ],
            'recruitment-consultation' => [
                'বাংলাদেশ থেকে কর্মী নিয়োগে আগ্রহী বিদেশি নিয়োগকর্তাদের জন্য পরামর্শ।',
                'Advice for overseas employers planning to recruit workers from Bangladesh.',
            ],
        ];

        foreach ($services as $slug => [$bn, $en]) {
            $service = Service::query()->whereHas('translations', fn ($q) => $q->where('slug', $slug))->with('translations')->first();
            if (! $service) {
                continue;
            }
            $titles = $service->translations->pluck('title', 'locale');
            $service->syncTranslations([
                'bn' => ['title' => $titles['bn'], 'slug' => $slug, 'summary' => $bn, 'body' => "<p>{$bn}</p>", 'is_reviewed' => true],
                'en' => ['title' => $titles['en'], 'slug' => $slug, 'summary' => $en, 'body' => "<p>{$en}</p>", 'is_reviewed' => true],
            ]);
            $service->update(['status' => PublishStatus::Published]);
        }
    }

    /** Partnership confirmed by the company's Super Admin. Logos are added later in the CMS. */
    private function partners(): void
    {
        $partners = [
            'vital-healthcare' => [
                'মালয়েশিয়ার মেডিকেল ইকুইপমেন্ট প্রস্তুতকারী প্রতিষ্ঠান। আমরা এর কারখানার জন্য ফ্যাক্টরি ওয়ার্কার নিয়োগ করি।',
                'Medical equipment manufacturer in Malaysia. We recruit factory workers for its production facility.',
            ],
            'dai-suwon-packaging' => [
                'মালয়েশিয়ার কার্টন ও প্যাকেজিং প্রস্তুতকারী প্রতিষ্ঠান। আমরা এর জন্য কার্টন ফ্যাক্টরি ওয়ার্কার নিয়োগ করি।',
                'Carton and packaging manufacturer in Malaysia. We recruit carton factory workers for the company.',
            ],
            'jubaid-al-khair' => [
                'সৌদি আরবের নিয়োগকর্তা প্রতিষ্ঠান। আমরা ভিসা প্রসেসিং ও টিকেটিং সফটওয়্যারে দক্ষ কম্পিউটার অপারেটর নিয়োগ করি।',
                'Employer in Saudi Arabia. We recruit computer operators skilled in visa processing and ticketing software.',
            ],
            'jusur-almawared-hr' => [
                'সৌদি আরবের হিউম্যান রিসোর্সেস প্রতিষ্ঠান। আমরা ড্রাইভার, ক্লিনার, ভবন রক্ষণাবেক্ষণ টেকনিশিয়ান ও লোডিং কর্মী নিয়োগ করি।',
                'Human resources company in Saudi Arabia. We recruit drivers, cleaners, building maintenance technicians and loading workers.',
            ],
        ];

        $sort = 0;
        foreach ($partners as $slug => [$bn, $en]) {
            $company = Company::query()->where('slug', $slug)->first();
            if (! $company) {
                continue;
            }
            $company->syncTranslations([
                'bn' => ['description' => $bn, 'is_reviewed' => true],
                'en' => ['description' => $en, 'is_reviewed' => true],
            ]);
            $company->update([
                'verification_status' => VerificationStatus::Verified,
                'is_partner_displayed' => true,
                'sort' => $sort++,
                'internal_note' => 'Partnership confirmed by the Super Admin on '.now()->toDateString().'. Logo usage permission still to be recorded.',
            ]);
        }
    }

    private function showContactPersons(): void
    {
        Setting::query()->where('key', 'show_contact_persons')->first()?->update(['value' => ['v' => true]]);
        app(SettingsService::class)->flush();
    }

    /** @param  array<string, array{title: string, summary: ?string, body: ?string}>  $translations */
    private function publishPage(string $key, array $translations): Page
    {
        $page = Page::query()->firstOrCreate(['key' => $key], ['status' => PublishStatus::Draft]);
        $slug = str_replace('_', '-', $key);

        $page->syncTranslations(collect($translations)->map(fn ($t) => $t + ['slug' => $slug, 'is_reviewed' => true])->all());
        $page->update(['status' => PublishStatus::Published]);

        return $page;
    }
}
