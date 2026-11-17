<?php
// UI write workflow: create + publish a portfolio via the admin form, verify public API, delete via UI.
require __DIR__.'/../../vendor/autoload.php';
use HeadlessChromium\BrowserFactory;

$base = rtrim(getenv('E2E_BASE_URL') ?: 'http://127.0.0.1:8000', '/');
$out = $argv[1] ?? __DIR__.'/../../storage/app/e2e';
@mkdir($out, 0775, true);
$env = parse_ini_file(__DIR__.'/../../.env', false, INI_SCANNER_RAW);
$browser = (new BrowserFactory(getenv('E2E_CHROME') ?: '/usr/bin/google-chrome'))->createBrowser(['windowSize' => [1440, 1000], 'noSandbox' => true]);
$page = $browser->createPage();
$wait = function (string $js, int $ms = 8000) use ($page) { $end = microtime(true) + $ms / 1000; while (microtime(true) < $end) { if ($page->evaluate($js)->getReturnValue()) return true; usleep(150000); } return false; };
$js = fn (string $code) => $page->evaluate("(()=>{const setIn=(el,v)=>{const proto=el.tagName==='SELECT'?HTMLSelectElement:el.tagName==='TEXTAREA'?HTMLTextAreaElement:HTMLInputElement;Object.getOwnPropertyDescriptor(proto.prototype,'value').set.call(el,v);el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));};const q=s=>document.querySelector(s);const byText=(sel,t)=>[...document.querySelectorAll(sel)].find(e=>e.textContent.trim().startsWith(t));{$code}})()")->getReturnValue();

$page->navigate("$base/admin/login")->waitForNavigation();
$wait("!!document.querySelector('input[type=email]')");
$js("setIn(q('input[type=email]'),".json_encode(trim($env['ADMIN_EMAIL'], '"')).");setIn(q('input[type=password]'),".json_encode(trim($env['ADMIN_PASSWORD'], '"')).");q('form button[type=submit]').click();");
echo 'login: '.($wait("location.pathname==='/admin'", 10000) ? 'OK' : 'FAIL')."\n";

$page->navigate("$base/admin/portfolios/new")->waitForNavigation();
$wait("!!document.getElementById('translations.en.title')");
$js("byText('[role=tab]','English').click();");
usleep(300000);
$js("setIn(document.getElementById('translations.en.title'),'E2E Test Project Alpha');");
usleep(300000);
$slug = $js("return document.getElementById('translations.en.slug').value;");
echo "auto slug: $slug\n";
$js("setIn(document.getElementById('translations.en.summary'),'Created by the automated UI test.');");
$js("[...document.querySelectorAll('[role=switch]')].find(s=>s.closest('label').textContent.includes('English text reviewed')).click();");
$js("setIn([...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='published')),'published');");
$js("byText('button','Save').click();");
$saved = $wait("/\\/admin\\/portfolios\\/\\d+$/.test(location.pathname)", 10000);
$id = $saved ? basename($page->evaluate('location.pathname')->getReturnValue()) : null;
echo 'created via UI: '.($saved ? "OK (#$id)" : 'FAIL').'  toast: '.$page->evaluate("document.querySelector('[role=status]')?.textContent ?? ''")->getReturnValue()."\n";
$page->screenshot()->saveToFile("$out/b-created.png");

$api = json_decode(file_get_contents("$base/api/v1/portfolios/$slug?locale=bn"), true);
echo 'public API (bn visitor): '.($api['data']['title'] ?? 'NOT FOUND').' [served in '.($api['data']['locale'] ?? '-')."]\n";

// Validation round-trip: duplicate slug must show a field error from the server.
$page->navigate("$base/admin/portfolios/new")->waitForNavigation();
$wait("!!document.getElementById('translations.en.title')");
$js("byText('[role=tab]','English').click();");
usleep(300000);
$js("setIn(document.getElementById('translations.en.title'),'E2E Test Project Alpha');");
usleep(200000);
$js("byText('button','Save').click();");
$wait("document.body.innerText.includes('already been taken')", 8000);
echo 'duplicate slug error shown: '.($page->evaluate("document.body.innerText.includes('already been taken')")->getReturnValue() ? 'yes' : 'no')."\n";

// Delete through the UI confirm dialog.
$page->navigate("$base/admin/portfolios/$id")->waitForNavigation();
$wait("!!document.getElementById('translations.en.title')");
$js("byText('button','Delete').click();");
$wait("!!document.querySelector('[role=dialog]')");
$js("[...document.querySelectorAll('[role=dialog] button')].find(b=>b.textContent.trim()==='Delete').click();");
echo 'deleted via UI: '.($wait("location.pathname==='/admin/portfolios'", 8000) ? 'OK' : 'FAIL')."\n";
$code = @get_headers("$base/api/v1/portfolios/$slug")[0];
echo "public API after delete: $code\n";
$browser->close();
