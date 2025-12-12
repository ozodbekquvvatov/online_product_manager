<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OurBusiness</title>
</head>
<body>
    <div id="root"></div>
    
    <!-- Load the built React files -->
    @if (file_exists(public_path('assets/index.html')))
        @include(public_path('assets/index.html'))
    @else
        <script>
            // Fallback or error message
            console.error('React build not found. Run npm run build in your React project.');
        </script>
    @endif
</body>
</html>