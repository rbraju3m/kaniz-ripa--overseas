<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\PublishStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminResource;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * Shared admin CRUD. Route middleware enforces "{module}.{action}" permissions;
 * this class additionally requires "{module}.publish" for any change that
 * publishes or unpublishes a record.
 */
abstract class CrudController extends Controller
{
    /** @return class-string<Model> */
    abstract protected function modelClass(): string;

    abstract protected function module(): string;

    /** @return class-string<FormRequest> */
    abstract protected function requestClass(): string;

    /** Relations loaded for show/store/update responses. */
    protected function relations(): array
    {
        return $this->translatable() ? ['translations'] : [];
    }

    /** Relations loaded for the index listing. */
    protected function listRelations(): array
    {
        return $this->relations();
    }

    /** Translation columns searched by ?search= */
    protected function searchColumns(): array
    {
        return ['title'];
    }

    protected function applyFilters(Builder $query, Request $request): void
    {
        //
    }

    /** Hook to adjust base attributes before saving. */
    protected function prepare(array $attributes, ?Model $existing): array
    {
        return $attributes;
    }

    /** Hook after the record and translations are saved. */
    protected function afterSave(Model $model, array $validated): void
    {
        //
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $this->query()->with($this->listRelations());

        if ($status = $request->query('status')) {
            $query->where('status', (string) $status);
        }

        if (($search = trim((string) $request->query('search'))) !== '') {
            $this->applySearch($query, $search);
        }

        $this->applyFilters($query, $request);

        $sort = in_array('sort', (new ($this->modelClass()))->getFillable(), true) ? 'sort' : 'id';
        $query->orderBy($sort)->orderByDesc('id');

        return AdminResource::collection($query->paginate(min(max($request->integer('per_page', 20), 1), 100)));
    }

    public function show(int $id): AdminResource
    {
        return AdminResource::make($this->query()->with($this->relations())->findOrFail($id));
    }

    public function store(): JsonResponse
    {
        $validated = app($this->requestClass())->validated();
        $model = $this->persist(new ($this->modelClass()), $validated);

        return AdminResource::make($model)->response()->setStatusCode(201);
    }

    public function update(int $id): AdminResource
    {
        $model = $this->query()->findOrFail($id);
        $validated = app($this->requestClass())->validated();

        return AdminResource::make($this->persist($model, $validated));
    }

    public function destroy(int $id): JsonResponse
    {
        $model = $this->query()->findOrFail($id);
        $this->authorizePublishChange($model, null, deleting: true);
        $model->delete();

        return response()->json(null, 204);
    }

    protected function query(): Builder
    {
        return ($this->modelClass())::query();
    }

    protected function translatable(): bool
    {
        return in_array(HasTranslations::class, class_uses_recursive($this->modelClass()), true);
    }

    protected function persist(Model $model, array $validated): Model
    {
        $existing = $model->exists ? $model : null;
        $attributes = $this->prepare(collect($validated)->except('translations')->only($model->getFillable())->all(), $existing);

        $this->authorizePublishChange($model, $attributes['status'] ?? null);

        DB::transaction(function () use ($model, $attributes, $validated) {
            $model->fill($attributes)->save();

            if ($this->translatable() && isset($validated['translations'])) {
                $model->syncTranslations($validated['translations']);
            }

            $this->afterSave($model, $validated);
        });

        return $model->refresh()->load($this->relations());
    }

    protected function authorizePublishChange(Model $model, mixed $newStatus, bool $deleting = false): void
    {
        if (! array_key_exists('status', $model->getCasts())) {
            return;
        }

        $published = PublishStatus::Published->value;
        $old = $model->exists ? ($model->status?->value ?? $model->status) : null;
        $new = $newStatus instanceof PublishStatus ? $newStatus->value : $newStatus;

        $touchesPublished = $deleting
            ? $old === $published
            : ($new !== null && $new !== $old && ($new === $published || $old === $published));

        if ($touchesPublished) {
            Gate::authorize("{$this->module()}.publish");
        }
    }

    protected function applySearch(Builder $query, string $search): void
    {
        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $search).'%';

        if ($this->translatable()) {
            $columns = $this->searchColumns();
            $query->whereHas('translations', function (Builder $q) use ($columns, $like) {
                $q->where(function (Builder $w) use ($columns, $like) {
                    foreach ($columns as $column) {
                        $w->orWhere($column, 'like', $like);
                    }
                });
            });
        }
    }
}
