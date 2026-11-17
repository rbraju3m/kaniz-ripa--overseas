<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

/**
 * Contact details are taken verbatim from the company's official recruitment posters.
 * Everything not on the posters is a flagged placeholder (see docs/MISSING-INFO.md).
 */
class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // group, key, value, translatable, public, placeholder, note
            ['general', 'site_name', ['bn' => 'কানিজ রিপা ওভারসিজ', 'en' => 'Kaniz Ripa Overseas'], true, true, false, null],
            ['general', 'tagline', ['bn' => 'বিদেশে কর্মসংস্থানে আপনার বিশ্বস্ত সঙ্গী।', 'en' => 'Your Trusted Partner for Overseas Employment.'], true, true, true, 'Suggested tagline — needs client approval.'],
            ['general', 'license_number', null, false, true, true, 'Government recruiting licence (RL) number — missing.'],
            ['general', 'founded_year', null, false, true, true, 'Founding year — missing.'],

            ['contact', 'phone', '+880 2222270423', false, true, false, 'From official posters.'],
            ['contact', 'mobiles', [
                ['number' => '01732803369', 'name' => ['bn' => 'মনিরুজ্জামান', 'en' => 'Moniruzzaman'], 'role' => ['bn' => 'ম্যানেজিং ডিরেক্টর', 'en' => 'Managing Director'], 'whatsapp' => false],
                ['number' => '01611444882', 'name' => ['bn' => 'হাবিবুল্লাহ', 'en' => 'Habibullah'], 'role' => ['bn' => 'মার্কেটিং ম্যানেজার', 'en' => 'Marketing Manager'], 'whatsapp' => false],
                ['number' => '01953979687', 'name' => ['bn' => 'রিফাত', 'en' => 'Rifat'], 'role' => ['bn' => 'জেনারেল ম্যানেজার', 'en' => 'General Manager'], 'whatsapp' => false],
                ['number' => '01729762344', 'name' => ['bn' => 'রাজু', 'en' => 'Raju'], 'role' => ['bn' => 'আইটি ম্যানেজার', 'en' => 'IT Manager'], 'whatsapp' => false],
            ], false, true, false, 'From official posters. WhatsApp availability per number must be confirmed.'],
            ['contact', 'show_contact_persons', false, false, true, false, 'Show the named contact persons publicly only after client approval.'],
            ['contact', 'address', [
                'bn' => 'বাড়ি-৭৯ (৭ম তলা/লিফট-৬), ব্লক-এল, তারেক মেনসন, মেইন রোড, চেয়ারম্যান বাড়ি, বনানী, ঢাকা-১২১৩',
                'en' => 'House-79 (7th Floor, Lift-6), Block-L, Tarek Mansion, Main Road, Chairman Bari, Banani, Dhaka-1213',
            ], true, true, false, 'BN from official posters; EN rendering needs client review.'],
            ['contact', 'email', null, false, true, true, 'Email — missing.'],
            ['contact', 'whatsapp_number', null, false, true, true, 'WhatsApp number — missing.'],
            ['contact', 'map_embed_url', null, false, true, true, 'Google Maps embed URL — missing.'],
            ['contact', 'office_hours', null, true, true, true, 'Office hours — missing.'],

            ['social', 'facebook_url', null, false, true, true, 'Facebook page — missing.'],
            ['social', 'youtube_url', null, false, true, true, 'YouTube channel — missing.'],
            ['social', 'linkedin_url', null, false, true, true, 'LinkedIn page — missing.'],

            ['branding', 'logo_media_id', null, false, true, true, 'High-resolution / vector logo — missing.'],
            ['branding', 'show_bismillah', false, false, true, false, 'Client to decide whether to show Bismillah calligraphy.'],

            ['seo', 'default_og_media_id', null, false, true, true, 'Default social share image — missing.'],
        ];

        foreach ($settings as [$group, $key, $value, $translatable, $public, $placeholder, $note]) {
            Setting::query()->firstOrCreate(['key' => $key], [
                'group' => $group,
                'value' => ['v' => $value],
                'is_translatable' => $translatable,
                'is_public' => $public,
                'is_placeholder' => $placeholder,
                'note' => $note,
            ]);
        }
    }
}
