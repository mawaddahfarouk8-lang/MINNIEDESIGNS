
<?php

session_start();

require_once __DIR__ . "/config/db.php";

header("Content-Type: application/json; charset=UTF-8");

error_log(
    "[MINNIE DEBUG] PLACE_ORDER_EXECUTED | FILE=" . __FILE__ .
    " | DATABASE=" . $pdo->query("SELECT DATABASE()")->fetchColumn()
);

function respond($status, $data) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    respond(405, [
        "success" => false,
        "message" => "POST method required."
    ]);
}

$input = json_decode($_POST["order"] ?? "", true);

if (!is_array($input)) {
    error_log("[MINNIE DEBUG] Invalid order payload.");

    respond(400, [
        "success" => false,
        "message" => "Invalid order data."
    ]);
}

$name = trim($input["name"] ?? "");
$phone = trim($input["phone"] ?? "");
$email = trim($input["email"] ?? "");
$city = trim($input["city"] ?? "");
$address = trim($input["address"] ?? "");
$notes = trim($input["notes"] ?? "");
$payment = $input["payment"] ?? "";
$items = $input["items"] ?? [];

$allowedPayments = [
    "cash_on_delivery",
    "instapay",
    "vodafone_cash"
];

if (
    $name === "" ||
    strlen($name) > 100 ||
    $phone === "" ||
    strlen($phone) > 25 ||
    $city === "" ||
    $address === "" ||
    strlen($address) > 255 ||
    strlen($notes) > 5000 ||
    !in_array($payment, $allowedPayments, true) ||
    !is_array($items) ||
    count($items) === 0 ||
    count($items) > 50
) {
    respond(422, [
        "success" => false,
        "message" => "Please check your order details."
    ]);
}

if (
    $email !== "" &&
    (
        !filter_var($email, FILTER_VALIDATE_EMAIL) ||
        strlen($email) > 190
    )
) {
    respond(422, [
        "success" => false,
        "message" => "Invalid email address."
    ]);
}

$needsProof = in_array(
    $payment,
    ["instapay", "vodafone_cash"],
    true
);

$proof = $_FILES["proof"] ?? null;
$proofPath = null;
$absoluteProofPath = null;
$uploadDir = null;
$mime = null;
$extensions = [];

try {
    // Validate payment screenshot when required.
    if ($needsProof) {
        if (
            !$proof ||
            !isset(
                $proof["error"],
                $proof["tmp_name"],
                $proof["size"]
            ) ||
            $proof["error"] !== UPLOAD_ERR_OK ||
            !is_uploaded_file($proof["tmp_name"])
        ) {
            throw new InvalidArgumentException(
                "Please upload a valid payment screenshot."
            );
        }

        if (
            $proof["size"] < 1 ||
            $proof["size"] > 5 * 1024 * 1024
        ) {
            throw new InvalidArgumentException(
                "The screenshot must be no larger than 5 MB."
            );
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($proof["tmp_name"]);

        $extensions = [
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/webp" => "webp"
        ];

        if (
            !isset($extensions[$mime]) ||
            @getimagesize($proof["tmp_name"]) === false
        ) {
            throw new InvalidArgumentException(
                "Upload a valid JPG, PNG, or WEBP screenshot."
            );
        }
    } elseif (
        $proof &&
        $proof["error"] !== UPLOAD_ERR_NO_FILE &&
        $proof["error"] !== UPLOAD_ERR_OK
    ) {
        throw new InvalidArgumentException(
            "The uploaded file could not be processed."
        );
    }

    $pdo->beginTransaction();

    $subtotal = 0;
    $validatedItems = [];

    // Allowed product options and their additional prices.
    $allowedOptions = [
        1 => [
            "Paper" => [
                "Matte" => 0,
                "Glossy" => 10,
                "Textured" => 25
            ],
            "Pack" => [
                "100 cards" => 0,
                "200 cards" => 120
            ]
        ],
        2 => [
            "Pages" => [
                "8 pages" => 0,
                "16 pages" => 200,
                "24 pages" => 400
            ],
            "Paper" => [
                "Matte" => 0,
                "Glossy" => 50
            ]
        ],
        3 => [
            "Type" => [
                "Notebook" => 0,
                "Coloring book" => 0
            ],
            "Cover" => [
                "Soft cover" => 0,
                "Hard cover" => 40
            ]
        ]
    ];

    $requiredOptions = [
        1 => ["Paper", "Pack"],
        2 => ["Pages", "Paper"],
        3 => ["Type", "Cover"]
    ];

    $personalFields = [
        "Name on card" => 100,
        "Title" => 100,
        "Phone on card" => 25,
        "Card color" => 50
    ];

    foreach ($items as $item) {
        if (!is_array($item)) {
            throw new InvalidArgumentException(
                "Invalid cart item."
            );
        }

        $productId = filter_var(
            $item["id"] ?? null,
            FILTER_VALIDATE_INT
        );

        $quantity = filter_var(
            $item["qty"] ?? null,
            FILTER_VALIDATE_INT
        );

        if (
            !$productId ||
            !$quantity ||
            $quantity < 1 ||
            $quantity > 99
        ) {
            throw new InvalidArgumentException(
                "Invalid product or quantity."
            );
        }

        $stmt = $pdo->prepare(
            "SELECT id, name, price
             FROM products
             WHERE id = ? AND is_active = 1"
        );

        $stmt->execute([$productId]);
        $product = $stmt->fetch();

        if (!$product) {
            throw new InvalidArgumentException(
                "A selected product is unavailable."
            );
        }

        $productId = (int) $product["id"];
        $options = $item["options"] ?? [];

        if (
            !is_array($options) ||
            !isset($requiredOptions[$productId])
        ) {
            throw new InvalidArgumentException(
                "Invalid product options."
            );
        }

        // Validate every required option exactly once.
        foreach ($requiredOptions[$productId] as $requiredKey) {
            if (
                !array_key_exists($requiredKey, $options) ||
                !is_string($options[$requiredKey])
            ) {
                error_log(
                    "[MINNIE DEBUG] Missing option: " .
                    $requiredKey .
                    " | Product ID: " . $productId .
                    " | Received options: " .
                    json_encode($options, JSON_UNESCAPED_UNICODE)
                );

                throw new InvalidArgumentException(
                    "Missing option: " . $requiredKey .
                    " for product ID " . $productId
                );
            }
        }

        $unitPrice = (float) $product["price"];

        if (!is_finite($unitPrice) || $unitPrice < 0) {
            throw new RuntimeException(
                "Invalid product price configuration."
            );
        }

        // Validate choices and calculate additional prices.
        foreach ($options as $key => $value) {
            if (!is_string($key)) {
                throw new InvalidArgumentException(
                    "Invalid product option."
                );
            }

            // Business card personalization does not change price.
            if (
                $productId === 1 &&
                array_key_exists($key, $personalFields)
            ) {
                if (
                    !is_string($value) ||
                    strlen($value) > $personalFields[$key]
                ) {
                    throw new InvalidArgumentException(
                        "Invalid business card personalization."
                    );
                }

                continue;
            }

            $choices = $allowedOptions[$productId][$key] ?? null;

            if (
                $choices === null ||
                !is_string($value) ||
                !array_key_exists($value, $choices)
            ) {
                throw new InvalidArgumentException(
                    "Invalid product option."
                );
            }

            $unitPrice += $choices[$value];
        }

        $lineTotal = $unitPrice * $quantity;
        $subtotal += $lineTotal;

        $validatedItems[] = [
            "id" => $productId,
            "name" => $product["name"],
            "price" => $unitPrice,
            "qty" => $quantity,
            "options" => $options
        ];
    }

    // Delivery fees.
    $shippingFees = [
        "Port Said" => 30,
        "Port Fouad" => 40
    ];

    if (!array_key_exists($city, $shippingFees)) {
        throw new InvalidArgumentException(
            "Invalid delivery area."
        );
    }

    $shipping = $shippingFees[$city];
    $total = $subtotal + $shipping;

    // Save payment proof for electronic payments.
    if ($needsProof) {
        $uploadDir = __DIR__ . "/uploads/payment-proofs";

        if (!is_dir($uploadDir)) {
            if (
                !mkdir($uploadDir, 0750, true) &&
                !is_dir($uploadDir)
            ) {
                throw new RuntimeException(
                    "Could not prepare payment proof storage."
                );
            }
        }

        $htaccess = $uploadDir . "/.htaccess";

        if (
            !file_exists($htaccess) &&
            file_put_contents(
                $htaccess,
                "Require all denied\n"
            ) === false
        ) {
            throw new RuntimeException(
                "Could not protect payment proof storage."
            );
        }

        $filename = bin2hex(random_bytes(24)) .
            "." . $extensions[$mime];

        $absoluteProofPath = $uploadDir . "/" . $filename;
        $proofPath = "uploads/payment-proofs/" . $filename;

        if (!move_uploaded_file(
            $proof["tmp_name"],
            $absoluteProofPath
        )) {
            throw new RuntimeException(
                "Could not save the payment screenshot."
            );
        }

        chmod($absoluteProofPath, 0640);
    }

    $orderNumber = "MD-" . strtoupper(bin2hex(random_bytes(6)));

    $paymentStatus = "pending";
    $proofStatus = $needsProof ? "pending" : "not_required";
    $userId = $_SESSION["user_id"] ?? null;

    error_log(
        "[MINNIE DEBUG] BEFORE_ORDER_INSERT | DATABASE=" .
        $pdo->query("SELECT DATABASE()")->fetchColumn() .
        " | ORDER=" . $orderNumber
    );

    $stmt = $pdo->prepare(
        "INSERT INTO orders (
            order_number,
            user_id,
            customer_name,
            customer_email,
            customer_phone,
            shipping_address,
            shipping_city,
            shipping_notes,
            subtotal,
            shipping_fee,
            total,
            payment_method,
            payment_status,
            order_status,
            payment_proof,
            payment_reference,
            proof_review_status
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL, ?
        )"
    );

    $stmt->execute([
        $orderNumber,
        $userId,
        $name,
        $email,
        $phone,
        $address,
        $city,
        $notes !== "" ? $notes : null,
        $subtotal,
        $shipping,
        $total,
        $payment,
        $paymentStatus,
        $proofPath,
        $proofStatus
    ]);

    $orderId = (int) $pdo->lastInsertId();

    $itemStmt = $pdo->prepare(
        "INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            unit_price,
            quantity,
            line_total,
            customization_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    foreach ($validatedItems as $item) {
        $itemStmt->execute([
            $orderId,
            $item["id"],
            $item["name"],
            $item["price"],
            $item["qty"],
            $item["price"] * $item["qty"],
            json_encode(
                $item["options"],
                JSON_UNESCAPED_UNICODE
            )
        ]);
    }

    $pdo->commit();

    error_log(
        "[MINNIE DEBUG] ORDER_COMMITTED | ID=" .
        $orderId . " | ORDER=" . $orderNumber
    );

    respond(201, [
        "success" => true,
        "order_number" => $orderNumber,
        "message" => $needsProof
            ? "Order received. Payment is awaiting verification."
            : "Order saved successfully."
    ]);

} catch (InvalidArgumentException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if ($absoluteProofPath && is_file($absoluteProofPath)) {
        unlink($absoluteProofPath);
    }

    error_log(
        "[MINNIE DEBUG] ORDER_VALIDATION_FAILED: " .
        $e->getMessage()
    );

    respond(422, [
        "success" => false,
        "message" => $e->getMessage()
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if ($absoluteProofPath && is_file($absoluteProofPath)) {
        unlink($absoluteProofPath);
    }

    error_log(
        "[MINNIE DEBUG] ORDER_FAILED: " .
        $e->getMessage() .
        " | FILE=" . $e->getFile() .
        " | LINE=" . $e->getLine()
    );

    respond(500, [
        "success" => false,
        "message" => "Could not save the order."
    ]);
}
