<?php

namespace App\Http\Requests\Admin;

use App\Enums\GalleryMediaType;
use Illuminate\Validation\Rule;

class GalleryMediaRequest extends AdminRequest
{
    public function rules(): array
    {
        return [
            'gallery_category_id' => ['nullable', 'integer', 'exists:gallery_categories,id'],
            'type' => ['required', Rule::enum(GalleryMediaType::class)],
            'media_id' => ['nullable', 'required_if:type,image', 'integer', 'exists:media,id'],
            'video_url' => ['nullable', 'required_if:type,video', 'url:https', 'max:255', 'regex:#^https://(www\.)?(youtube\.com|youtu\.be|facebook\.com|fb\.watch|vimeo\.com)/#i'],
            'title' => ['nullable', 'array'],
            'title.bn' => ['nullable', 'string', 'max:190'],
            'title.en' => ['nullable', 'string', 'max:190'],
            'status' => $this->statusRule(),
            'sort' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
