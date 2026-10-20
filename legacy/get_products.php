
<?php
require_once __DIR__ . "/config/db.php";

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, no-cache, must-revalidate");

try {
    $sql = "
        SELECT
            p.id,
            p.category_id,
            p.name,
            p.description,
            p.price,
            p.image_path,
            p.is_customizable,
            c.name AS category_name
        FROM products p
        INNER JOIN categories c
            ON c.id = p.category_id
        WHERE p.is_active = 1
          AND c.is_active = 1
        ORDER BY p.id ASC
    ";

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $products = [];

    foreach ($rows as $row) {
        $products[] = [
            "id" => (int) $row["id"],
            "category_name" => $row["category_name"],
            "cat" => (int) $row["category_id"],
            "name" => $row["name"],
            "desc" => $row["description"] ?? "",
            "price" => (float) $row["price"],
            "unit" => "per design",
            "personalize" => (bool) $row["is_customizable"],
            "images" => $row["image_path"]
                ? [$row["image_path"]]
                : [],
            "options" => []
        ];
    }

    echo json_encode([
        "success" => true,
        "products" => $products
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Could not load products."
    ], JSON_UNESCAPED_UNICODE);
}
