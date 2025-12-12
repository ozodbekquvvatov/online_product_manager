<?php
// index.php - Laravel + React hybrid

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// 1. Static fayllarni berish
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false;
}

// 2. API so'rovlari Laravelga
if (strpos($uri, '/api/') === 0 || 
    strpos($uri, '/sanctum/') === 0 ||
    strpos($uri, '/storage/') === 0) {
    
    require __DIR__.'/../vendor/autoload.php';
    $app = require_once __DIR__.'/../bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
    $response = $kernel->handle(
        $request = Illuminate\Http\Request::capture()
    );
    $response->send();
    $kernel->terminate($request, $response);
    exit;
}

// 3. Boshqa hamma narsa Reactga
if (file_exists(__DIR__ . '/index.html')) {
    readfile(__DIR__ . '/index.html');
} else {
    echo '<h1>React App Not Found</h1>';
    echo '<p>Please run: npm run build in frontend folder</p>';
}
?>