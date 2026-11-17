<?php

return [
    /*
     * When the profile source is "generated", rebuild the BN + EN PDFs automatically
     * whenever published website content changes (debounced, on the queue).
     */
    'auto_regenerate' => (bool) env('PROFILE_AUTO_REGENERATE', true),

    // Seconds to wait after the last content change, so a burst of edits causes one rebuild.
    'regenerate_delay' => (int) env('PROFILE_REGENERATE_DELAY', 60),

    // Automatic rebuilds keep this many generated versions per language (the current one is never deleted).
    'keep_generated_versions' => (int) env('PROFILE_KEEP_GENERATED_VERSIONS', 5),
];
