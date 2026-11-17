<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\VerificationStatus;
use App\Http\Requests\Admin\CompanyRequest;
use App\Models\Company;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/** Verifying a company or showing it as a partner requires companies.publish. */
class CompanyController extends CrudController
{
    protected function modelClass(): string
    {
        return Company::class;
    }

    protected function module(): string
    {
        return 'companies';
    }

    protected function requestClass(): string
    {
        return CompanyRequest::class;
    }

    protected function relations(): array
    {
        return ['translations', 'logo', 'country.translations', 'industry.translations'];
    }

    protected function applySearch(Builder $query, string $search): void
    {
        $query->where('name', 'like', '%'.str_replace(['%', '_'], ['\%', '\_'], $search).'%');
    }

    protected function applyFilters(Builder $query, Request $request): void
    {
        $query->when($request->query('verification_status'), fn ($q, $v) => $q->where('verification_status', (string) $v))
            ->when($request->has('partner'), fn ($q) => $q->where('is_partner_displayed', $request->boolean('partner')));
    }

    protected function prepare(array $attributes, ?Model $existing): array
    {
        $wasVerified = $existing?->verification_status === VerificationStatus::Verified;
        $wasDisplayed = (bool) $existing?->is_partner_displayed;
        $verified = ($attributes['verification_status'] ?? $existing?->verification_status?->value) === VerificationStatus::Verified->value;
        $displayed = (bool) ($attributes['is_partner_displayed'] ?? $wasDisplayed);

        if ($verified !== $wasVerified || $displayed !== $wasDisplayed) {
            Gate::authorize('companies.publish');
        }

        // Un-verifying always hides the partner.
        if (! $verified) {
            $attributes['is_partner_displayed'] = false;
        }

        return $attributes;
    }

    public function destroy(int $id): \Illuminate\Http\JsonResponse
    {
        $company = Company::query()->findOrFail($id);
        if ($company->isPublicPartner()) {
            Gate::authorize('companies.publish');
        }
        $company->delete();

        return response()->json(null, 204);
    }
}
