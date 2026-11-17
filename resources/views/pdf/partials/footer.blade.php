<div style="width:100%;font-family:Arial,Helvetica,sans-serif;font-size:7.5pt;color:#64748b;padding:0 14mm;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;">
    <span style="display:inline-block;width:18mm;height:1.2mm;background:#A8741A;border-radius:1mm;"></span>
    <span>{{ $phone }}@if($website) &nbsp;·&nbsp; {{ preg_replace('#^https?://#', '', $website) }}@endif</span>
    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>
