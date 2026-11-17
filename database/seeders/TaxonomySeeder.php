<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\GalleryCategory;
use App\Models\Industry;
use Illuminate\Database\Seeder;

/**
 * Countries and industries observed on the company's official recruitment posters.
 * Names are factual labels, so they are seeded as reviewed.
 */
class TaxonomySeeder extends Seeder
{
    public function run(): void
    {
        $countries = [
            ['SA', 'সৌদি আরব', 'Saudi Arabia', true],
            ['MY', 'মালয়েশিয়া', 'Malaysia', true],
            ['VN', 'ভিয়েতনাম', 'Vietnam', true],
            ['BD', 'বাংলাদেশ', 'Bangladesh', false],
        ];

        foreach ($countries as $i => [$iso, $bn, $en, $served]) {
            $country = Country::query()->updateOrCreate(['iso2' => $iso], ['is_served' => $served, 'sort' => $i]);
            $country->syncTranslations([
                'bn' => ['name' => $bn, 'is_reviewed' => true],
                'en' => ['name' => $en, 'is_reviewed' => true],
            ]);
        }

        $industries = [
            ['manufacturing', 'উৎপাদন শিল্প', 'Manufacturing'],
            ['medical_equipment', 'চিকিৎসা সরঞ্জাম উৎপাদন', 'Medical Equipment Manufacturing'],
            ['packaging', 'প্যাকেজিং', 'Packaging'],
            ['human_resources', 'মানবসম্পদ সেবা', 'Human Resources Services'],
            ['facility_services', 'পরিচ্ছন্নতা ও রক্ষণাবেক্ষণ', 'Cleaning & Facility Maintenance'],
            ['transport', 'পরিবহন', 'Transport & Logistics'],
            ['construction', 'নির্মাণ', 'Construction'],
            ['garments', 'গার্মেন্টস', 'Garments'],
            ['office_administration', 'অফিস প্রশাসন', 'Office Administration'],
        ];

        foreach ($industries as $i => [$key, $bn, $en]) {
            $industry = Industry::query()->updateOrCreate(['key' => $key], ['sort' => $i]);
            $industry->syncTranslations([
                'bn' => ['name' => $bn, 'is_reviewed' => true],
                'en' => ['name' => $en, 'is_reviewed' => true],
            ]);
        }

        $categories = [
            ['company-activities', 'কোম্পানির কার্যক্রম', 'Company Activities'],
            ['office', 'অফিস', 'Office'],
            ['recruitment-activities', 'নিয়োগ কার্যক্রম', 'Recruitment Activities'],
            ['partner-activities', 'অংশীদার প্রতিষ্ঠানের কার্যক্রম', 'Partner Company Activities'],
            ['events', 'অনুষ্ঠান', 'Events'],
            ['videos', 'ভিডিও', 'Videos'],
        ];

        foreach ($categories as $i => [$slug, $bn, $en]) {
            $category = GalleryCategory::query()->updateOrCreate(['slug' => $slug], ['sort' => $i, 'is_active' => true]);
            $category->syncTranslations([
                'bn' => ['name' => $bn, 'is_reviewed' => true],
                'en' => ['name' => $en, 'is_reviewed' => true],
            ]);
        }
    }
}
