
<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, no-cache, must-revalidate");

if (isset($_SESSION["user_id"])) {
    echo json_encode([
        "loggedIn" => true,
        "name" => $_SESSION["user_name"] ?? "My Account"
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        "loggedIn" => false
    ], JSON_UNESCAPED_UNICODE);
}
