
<?php
header("Content-Type: application/json");

$message = json_decode(file_get_contents("php://input"))->message;

$api_key = "your-chatgpt-api-key";
$url = "https://api.openai.com/v1/completions";

$data = [
    "model" => "text-davinci-003",
    "prompt" => $message,
    "max_tokens" => 150,
];

$options = [
    "http" => [
        "header" => "Content-Type: application/json\r\n" .
                    "Authorization: Bearer $api_key\r\n",
        "method" => "POST",
        "content" => json_encode($data),
    ],
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

echo json_encode(["reply" => json_decode($result)->choices[0]->text]);
?>
