<?php

namespace Database\Seeders;

use App\Enums\PublishStatus;
use App\Enums\VerificationStatus;
use App\Models\Company;
use App\Models\Country;
use App\Models\Industry;
use App\Models\Portfolio;
use Illuminate\Database\Seeder;

/**
 * Companies and recruitment activities seen on the official recruitment posters.
 *
 * - Companies are UNVERIFIED and hidden: a partnership is never implied until the client confirms.
 * - Portfolio entries are DRAFTS. BN text summarises the posters; EN is an unreviewed draft.
 * - Salary tables and "apply now" details are intentionally omitted: this is a portfolio site, not a job board.
 */
class PosterContentSeeder extends Seeder
{
    public function run(): void
    {
        $country = fn (string $iso) => Country::query()->where('iso2', $iso)->value('id');
        $industry = fn (string $key) => Industry::query()->where('key', $key)->value('id');

        $companies = [
            'vital-healthcare' => ['Vital Healthcare Sdn Bhd', 'MY', 'medical_equipment'],
            'dai-suwon-packaging' => ['Dai Suwon Packaging Sdn Bhd', 'MY', 'packaging'],
            'jubaid-al-khair' => ['Jubaid Al Khair', 'SA', 'office_administration'],
            'jusur-almawared-hr' => ['Jusur Almawared Human Resources', 'SA', 'human_resources'],
        ];

        $ids = [];
        foreach ($companies as $slug => [$name, $iso, $ind]) {
            $ids[$slug] = Company::query()->firstOrCreate(['slug' => $slug], [
                'name' => $name,
                'country_id' => $country($iso),
                'industry_id' => $industry($ind),
                'verification_status' => VerificationStatus::Unverified,
                'is_partner_displayed' => false,
                'internal_note' => 'Seen on official recruitment poster. Partnership and logo usage need client confirmation.',
            ])->id;
        }

        $portfolios = [
            [
                'company' => 'vital-healthcare', 'country' => 'MY', 'industry' => 'medical_equipment', 'date' => '2026-10-28',
                'bn' => [
                    'title' => 'মালয়েশিয়ায় ভাইটাল হেলথকেয়ারে ফ্যাক্টরি ওয়ার্কার নিয়োগ',
                    'slug' => 'vital-healthcare-malaysia-factory-workers',
                    'summary' => 'Vital Healthcare Sdn Bhd-এর জন্য মেডিকেল ইকুইপমেন্ট ফ্যাক্টরি ওয়ার্কার নিয়োগ কার্যক্রম।',
                    'activities' => "পদবী: ফ্যাক্টরি ওয়ার্কার (Medical Equipment Factory Worker)\nডিউটি: ৮ ঘন্টা, সপ্তাহে ৬ দিন\nঅনলাইন ডেলিগেট ইন্টারভিউ: ২৮ অক্টোবর ২০২৬",
                ],
                'en' => [
                    'title' => 'Factory Worker Recruitment for Vital Healthcare, Malaysia',
                    'slug' => 'vital-healthcare-malaysia-factory-workers',
                    'summary' => 'Recruitment of medical equipment factory workers for Vital Healthcare Sdn Bhd.',
                    'activities' => "Position: Medical Equipment Factory Worker\nDuty: 8 hours, 6 days a week\nOnline delegate interview: 28 October 2026",
                ],
            ],
            [
                'company' => 'dai-suwon-packaging', 'country' => 'MY', 'industry' => 'packaging', 'date' => null,
                'bn' => [
                    'title' => 'মালয়েশিয়ায় দাই সুওন প্যাকেজিংয়ে কার্টন ফ্যাক্টরি ওয়ার্কার নিয়োগ',
                    'slug' => 'dai-suwon-packaging-malaysia-carton-factory-workers',
                    'summary' => 'Dai Suwon Packaging Sdn Bhd-এর জন্য কার্টন ফ্যাক্টরি ওয়ার্কার নিয়োগ কার্যক্রম।',
                    'activities' => "পদবী: কার্টন ফ্যাক্টরি ওয়ার্কার\nবেসিক ইংরেজি জানা প্রয়োজন",
                ],
                'en' => [
                    'title' => 'Carton Factory Worker Recruitment for Dai Suwon Packaging, Malaysia',
                    'slug' => 'dai-suwon-packaging-malaysia-carton-factory-workers',
                    'summary' => 'Recruitment of carton factory workers for Dai Suwon Packaging Sdn Bhd.',
                    'activities' => "Position: Carton Factory Worker\nBasic English required",
                ],
            ],
            [
                'company' => 'jubaid-al-khair', 'country' => 'SA', 'industry' => 'office_administration', 'date' => null,
                'bn' => [
                    'title' => 'সৌদি আরবে জুবাইদ আল খাইর কোম্পানিতে কম্পিউটার অপারেটর নিয়োগ',
                    'slug' => 'jubaid-al-khair-saudi-computer-operator',
                    'summary' => 'Jubaid Al Khair কোম্পানির জন্য কম্পিউটার অপারেটর নিয়োগ কার্যক্রম।',
                    'activities' => "পদের নাম: কম্পিউটার অপারেটর\nপ্রয়োজনীয় দক্ষতা: কম্পিউটার পরিচালনা (বিশেষ করে ভিসা প্রসেসিং ও টিকেটিং সফটওয়্যার)",
                ],
                'en' => [
                    'title' => 'Computer Operator Recruitment for Jubaid Al Khair, Saudi Arabia',
                    'slug' => 'jubaid-al-khair-saudi-computer-operator',
                    'summary' => 'Recruitment of computer operators for Jubaid Al Khair.',
                    'activities' => "Position: Computer Operator\nSkills: computer operation, especially visa processing and ticketing software",
                ],
            ],
            [
                'company' => 'jusur-almawared-hr', 'country' => 'SA', 'industry' => 'facility_services', 'date' => null,
                'bn' => [
                    'title' => 'সৌদি আরবে জুসুর আলমাওয়ারেদ হিউম্যান রিসোর্সেসের জন্য বিভিন্ন পদে নিয়োগ',
                    'slug' => 'jusur-almawared-saudi-multiple-positions',
                    'summary' => 'Jusur Almawared Human Resources-এর জন্য ড্রাইভার, ক্লিনার, টেকনিশিয়ান ও লোডিং কর্মী নিয়োগ কার্যক্রম।',
                    'activities' => "হেভি ড্রাইভার / লাইট ড্রাইভার\nইনডোর ক্লিনার\nভবন রক্ষণাবেক্ষণ টেকনিশিয়ান\nলোডিং ও আনলোডিং কর্মী\nসিটি ক্লিনার",
                ],
                'en' => [
                    'title' => 'Multi-position Recruitment for Jusur Almawared Human Resources, Saudi Arabia',
                    'slug' => 'jusur-almawared-saudi-multiple-positions',
                    'summary' => 'Recruitment of drivers, cleaners, technicians and loading workers for Jusur Almawared Human Resources.',
                    'activities' => "Heavy / light drivers\nIndoor cleaners\nBuilding maintenance technicians\nLoading and unloading workers\nCity cleaners",
                ],
            ],
            [
                'company' => null, 'country' => 'VN', 'industry' => 'manufacturing', 'date' => null,
                'bn' => [
                    'title' => 'ভিয়েতনামে বিভিন্ন শিল্পে কর্মী নিয়োগ',
                    'slug' => 'vietnam-industrial-workers',
                    'summary' => 'ভিয়েতনামে ফার্নিচার, প্লাস্টিক, নির্মাণ ও গার্মেন্টস খাতে কর্মী নিয়োগ কার্যক্রম।',
                    'activities' => "ফার্নিচার টেকনিশিয়ান / হেল্পার\nপ্লাস্টিক কোম্পানি টেকনিশিয়ান / হেল্পার\nকনস্ট্রাকশন ওয়ার্কার / টেকনিশিয়ান\nগার্মেন্টস অপারেটর\nচুক্তির মেয়াদ: ২ বছর (নবায়নযোগ্য)",
                ],
                'en' => [
                    'title' => 'Industrial Worker Recruitment in Vietnam',
                    'slug' => 'vietnam-industrial-workers',
                    'summary' => 'Recruitment for furniture, plastics, construction and garments sectors in Vietnam.',
                    'activities' => "Furniture technician / helper\nPlastics company technician / helper\nConstruction worker / technician\nGarments operator\nContract: 2 years (renewable)",
                ],
            ],
        ];

        foreach ($portfolios as $i => $p) {
            $exists = Portfolio::query()->whereHas('translations', fn ($q) => $q->where('slug', $p['bn']['slug']))->exists();
            if ($exists) {
                continue;
            }

            $portfolio = Portfolio::query()->create([
                'company_id' => $p['company'] ? $ids[$p['company']] : null,
                'country_id' => $country($p['country']),
                'industry_id' => $industry($p['industry']),
                'project_date' => $p['date'],
                'status' => PublishStatus::Draft,
                'sort' => $i,
                'internal_note' => 'Drafted from official recruitment poster. Review text, add images and confirm before publishing.',
            ]);

            $portfolio->syncTranslations([
                'bn' => $p['bn'] + ['is_reviewed' => false],
                'en' => $p['en'] + ['is_reviewed' => false],
            ]);
        }
    }
}
