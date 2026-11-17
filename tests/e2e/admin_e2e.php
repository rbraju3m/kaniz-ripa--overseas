<?php
// Drives the admin UI with headless Chrome: login, then screenshot key screens and collect JS errors.
require __DIR__.'/../../vendor/autoload.php';

use HeadlessChromium\BrowserFactory;

$base = rtrim(getenv('E2E_BASE_URL') ?: 'http://127.0.0.1:8000', '/');
$out = $argv[1] ?? __DIR__.'/../../storage/app/e2e';
@mkdir($out, 0775, true);
$env = parse_ini_file(__DIR__.'/../../.env', false, INI_SCANNER_RAW);
$email = trim($env['ADMIN_EMAIL'], '"');
$pass = trim($env['ADMIN_PASSWORD'], '"');

$browser = (new BrowserFactory(getenv('E2E_CHROME') ?: '/usr/bin/google-chrome'))->createBrowser(['windowSize' => [1440, 1000], 'noSandbox' => true]);
$page = $browser->createPage();
$errors = [];
$page->getSession()->on('method:Runtime.exceptionThrown', function ($p) use (&$errors) { $errors[] = $p['exceptionDetails']['exception']['description'] ?? json_encode($p); });
$page->getSession()->on('method:Runtime.consoleAPICalled', function ($p) use (&$errors) { if ($p['type'] === 'error') $errors[] = 'console: '.json_encode(array_column($p['args'], 'value')); });
$page->getSession()->sendMessageSync(new HeadlessChromium\Communication\Message('Runtime.enable'));

$wait = fn (string $js, int $ms = 8000) => (function () use ($page, $js, $ms) {
    $end = microtime(true) + $ms / 1000;
    while (microtime(true) < $end) { if ($page->evaluate($js)->getReturnValue()) return true; usleep(150000); }
    return false;
})();

$page->navigate("$base/admin/login")->waitForNavigation();
$wait("!!document.querySelector('input[type=email]')");
$setter = "const set=(el,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};";
$page->evaluate($setter."set(document.querySelector('input[type=email]'),".json_encode($email).");set(document.querySelector('input[type=password]'),".json_encode($pass).");document.querySelector('form button[type=submit]').click();");
$ok = $wait("location.pathname==='/admin' && document.body.innerText.includes('Portfolio projects')", 10000);
echo "login: ".($ok ? 'OK' : 'FAILED')."\n";
$page->screenshot()->saveToFile("$out/a-dashboard.png");

$shots = [
    'portfolios' => ['/admin/portfolios', "document.querySelectorAll('tbody tr').length>0"],
    'portfolio-edit' => ['/admin/portfolios/1', "document.body.innerText.includes('Recruitment activities')"],
    'settings' => ['/admin/settings', "document.body.innerText.includes('Contact persons')"],
    'company-profile' => ['/admin/company-profile', "document.body.innerText.includes('Version history')"],
    'roles' => ['/admin/roles', "document.body.innerText.includes('super-admin')"],
    'pages-new' => ['/admin/pages/new', "document.body.innerText.includes('Items')"],
];
foreach ($shots as $name => [$path, $ready]) {
    $page->navigate($base.$path)->waitForNavigation();
    $r = $wait($ready);
    echo str_pad($name, 16).($r ? 'rendered' : 'NOT READY').'  '.$page->evaluate('location.href + " | " + document.body.innerText.slice(0,120).replace(/\\n/g," ")')->getReturnValue()."\n";
    $page->screenshot()->saveToFile("$out/a-$name.png");
}
echo "js errors: ".count($errors)."\n".implode("\n", array_slice($errors, 0, 10))."\n";
$browser->close();
