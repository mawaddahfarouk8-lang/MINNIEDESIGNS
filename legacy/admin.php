
<?php
session_start();
require_once __DIR__ . "/config/db.php";

/* =========================
   Admin login protection
========================= */

$secretFile = __DIR__ . "/config/admin_secret.php";

if (!file_exists($secretFile)) {
    http_response_code(503);
    exit("Admin setup required. Configure config/admin_secret.php first.");
}

$adminPassword = require $secretFile;

if (!is_string($adminPassword) || strlen($adminPassword) < 16) {
    http_response_code(503);
    exit("Admin password configuration is invalid.");
}

if (isset($_GET["logout"])) {
    unset($_SESSION["minnie_admin"], $_SESSION["admin_csrf"]);
    session_regenerate_id(true);
    header("Location: admin.php");
    exit;
}

if (empty($_SESSION["minnie_admin"])) {
    $error = "";

    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $submitted = (string)($_POST["password"] ?? "");

        if (hash_equals($adminPassword, $submitted)) {
            session_regenerate_id(true);
            $_SESSION["minnie_admin"] = true;
            $_SESSION["admin_csrf"] = bin2hex(random_bytes(32));

            header("Location: admin.php");
            exit;
        }

        $error = "Incorrect password.";
    }
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Admin Login — Minnie Design</title>
        <link rel="stylesheet" href="style.css">
        <style>
            body {
                background: #111;
                color: #fff;
                font-family: Arial, sans-serif;
            }
            .login {
                max-width: 420px;
                margin: 90px auto;
                padding: 30px;
                background: #202020;
                border-radius: 18px;
            }
            input {
                width: 100%;
                box-sizing: border-box;
                padding: 13px;
                margin: 12px 0;
                border-radius: 8px;
            }
            button {
                padding: 13px 22px;
                border: 0;
                border-radius: 25px;
                background: #ec6c9e;
                cursor: pointer;
                font-weight: bold;
            }
            .error { color: #ff8b8b; }
        </style>
    </head>
    <body>
        <main class="login">
            <h1>Minnie Design</h1>
            <h2>Admin Login</h2>

            <?php if ($error !== ""): ?>
                <p class="error"><?= htmlspecialchars($error) ?></p>
            <?php endif; ?>

            <form method="post" action="admin.php">
                <label for="password">Admin password</label>
                <input id="password" type="password"
                       name="password" required
                       autocomplete="current-password">
                <button type="submit">Log in</button>
            </form>
        </main>
    </body>
    </html>
    <?php
    exit;
}

/* =========================
   Security helpers
========================= */

if (empty($_SESSION["admin_csrf"])) {
    $_SESSION["admin_csrf"] = bin2hex(random_bytes(32));
}

function h($value): string {
    return htmlspecialchars(
        (string)($value ?? ""),
        ENT_QUOTES,
        "UTF-8"
    );
}

function egp($value): string {
    return number_format((float)$value, 2) . " EGP";
}

function getEnumValues(PDO $pdo, string $column): array {
    $allowedColumns = ["order_status", "payment_status"];

    if (!in_array($column, $allowedColumns, true)) {
        return [];
    }

    $stmt = $pdo->prepare(
        "SELECT COLUMN_TYPE
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'orders'
           AND COLUMN_NAME = ?"
    );

    $stmt->execute([$column]);
    $type = $stmt->fetchColumn();

    if (!$type || stripos($type, "enum(") !== 0) {
        return [];
    }

    preg_match_all(
        "/'((?:[^'\\\\]|\\\\.)*)'/",
        $type,
        $matches
    );

    return array_map(
        static fn($value) => stripcslashes($value),
        $matches[1] ?? []
    );
}

/* =========================
   Handle order updates
========================= */

$notice = "";
$error = "";

if (
    $_SERVER["REQUEST_METHOD"] === "POST"
    && isset($_POST["update_order"])
) {
    $token = (string)($_POST["csrf_token"] ?? "");
    $sessionToken = (string)($_SESSION["admin_csrf"] ?? "");

    if (
        $sessionToken === ""
        || !hash_equals($sessionToken, $token)
    ) {
        $error = "Security check failed. Refresh the page and try again.";
    } else {
        $orderId = filter_var(
            $_POST["order_id"] ?? null,
            FILTER_VALIDATE_INT
        );

        $newOrderStatus = (string)(
            $_POST["order_status"] ?? ""
        );

        $newPaymentStatus = (string)(
            $_POST["payment_status"] ?? ""
        );

        try {
            $orderStatuses = getEnumValues($pdo, "order_status");
            $paymentStatuses = getEnumValues($pdo, "payment_status");

            if (!$orderStatuses) {
                $orderStatuses = [
                    "pending",
                    "processing",
                    "shipped",
                    "delivered",
                    "cancelled"
                ];
            }

            if (!$paymentStatuses) {
                $paymentStatuses = [
                    "pending",
                    "paid",
                    "failed",
                    "refunded"
                ];
            }

            if (!$orderId || $orderId < 1) {
                throw new InvalidArgumentException("Invalid order ID.");
            }

            if (!in_array($newOrderStatus, $orderStatuses, true)) {
                throw new InvalidArgumentException("Invalid order status.");
            }

            if (!in_array($newPaymentStatus, $paymentStatuses, true)) {
                throw new InvalidArgumentException("Invalid payment status.");
            }

            $check = $pdo->prepare(
                "SELECT payment_method, payment_proof, payment_status
                 FROM orders
                 WHERE id = ?"
            );

            $check->execute([$orderId]);
            $existingOrder = $check->fetch();

            if (!$existingOrder) {
                throw new InvalidArgumentException("Order not found.");
            }

            $method = strtolower(
                (string)$existingOrder["payment_method"]
            );

            $isCash = in_array(
                $method,
                ["cash", "cash_on_delivery"],
                true
            );

            /*
             * Do not mark an electronic payment as paid based
             * only on the existence of a screenshot.
             * Verify receipt of funds before selecting Paid.
             */
            if (
                !$isCash
                && $newPaymentStatus === "paid"
                && empty($existingOrder["payment_proof"])
            ) {
                throw new InvalidArgumentException(
                    "No payment screenshot is attached to this order."
                );
            }

            $update = $pdo->prepare(
                "UPDATE orders
                 SET order_status = ?,
                     payment_status = ?
                 WHERE id = ?"
            );

            $update->execute([
                $newOrderStatus,
                $newPaymentStatus,
                $orderId
            ]);

            header("Location: admin.php?updated=1");
            exit;

        } catch (InvalidArgumentException $e) {
            $error = $e->getMessage();

        } catch (Throwable $e) {
            error_log("Admin update failed: " . $e->getMessage());
            $error = "Could not update this order. Check the PHP error log.";
        }
    }
}

if (isset($_GET["updated"])) {
    $notice = "Order updated successfully.";
}

/* =========================
   Load orders
========================= */

try {
    $ordersStmt = $pdo->query(
        "SELECT id, order_number, customer_name, customer_email,
                customer_phone, shipping_address, shipping_city,
                shipping_notes, subtotal, shipping_fee, total,
                payment_method, payment_status, order_status,
                payment_proof, payment_reference,
                proof_review_status, created_at
         FROM orders
         ORDER BY id DESC"
    );

    $orders = $ordersStmt->fetchAll();

    $itemsStmt = $pdo->prepare(
        "SELECT product_id, product_name, unit_price, quantity,
                line_total, customization_details
         FROM order_items
         WHERE order_id = ?
         ORDER BY id ASC"
    );

    $orderStatuses = getEnumValues($pdo, "order_status");
    $paymentStatuses = getEnumValues($pdo, "payment_status");

    if (!$orderStatuses) {
        $orderStatuses = [
            "pending",
            "processing",
            "shipped",
            "delivered",
            "cancelled"
        ];
    }

    if (!$paymentStatuses) {
        $paymentStatuses = [
            "pending",
            "paid",
            "failed",
            "refunded"
        ];
    }

} catch (Throwable $e) {
    error_log("Admin orders query failed: " . $e->getMessage());
    http_response_code(500);
    exit("Could not load orders. Check the PHP error log.");
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Orders — Minnie Design Admin</title>
    <link rel="stylesheet" href="style.css">

    <style>
        body {
            background: #111;
            color: #f5f5f5;
            font-family: Arial, sans-serif;
        }

        .admin-wrap {
            max-width: 1450px;
            margin: 35px auto;
            padding: 20px;
        }

        .admin-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
            background: #fff;
            color: #222;
            padding: 14px 20px;
            border-radius: 10px;
        }

        .admin-head h1 { margin: 0; }
        .admin-head a, a { color: #ff79ad; }

        .order-card {
            background: #202020;
            padding: 22px;
            margin: 22px 0;
            border-radius: 16px;
            overflow-wrap: anywhere;
        }

        .order-card h2 { color: #ff79ad; }

        .details {
            display: grid;
            grid-template-columns: repeat(
                auto-fit, minmax(220px, 1fr)
            );
            gap: 14px;
        }

        .detail {
            padding: 14px;
            background: #292929;
            border-radius: 10px;
        }

        .items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .items th, .items td {
            padding: 10px;
            border-bottom: 1px solid #444;
            text-align: left;
            vertical-align: top;
        }

        .items th { color: #ff9dc1; }

        .status {
            color: #ffcf78;
            font-weight: bold;
        }

        .muted { color: #bbb; }

        .admin-form {
            margin-top: 22px;
            padding: 18px;
            background: #292929;
            border-radius: 12px;
        }

        .admin-form label {
            display: block;
            margin: 10px 0 6px;
        }

        .admin-form select {
            width: 100%;
            max-width: 360px;
            padding: 11px;
            border-radius: 8px;
            background: #171717;
            color: #fff;
            border: 1px solid #555;
        }

        .admin-form button {
            margin-top: 16px;
            padding: 12px 22px;
            border: 0;
            border-radius: 25px;
            background: #ec6c9e;
            color: #171717;
            font-weight: bold;
            cursor: pointer;
        }

        .notice {
            background: #183c28;
            color: #b9ffd0;
            padding: 14px;
            border-radius: 10px;
        }

        .error {
            background: #491f27;
            color: #ffd0d7;
            padding: 14px;
            border-radius: 10px;
        }

        @media(max-width: 650px) {
            .items { font-size: 12px; }
            .items th, .items td { padding: 6px; }
            .admin-wrap { padding: 10px; }
            .order-card { padding: 14px; }
        }
    </style>
</head>

<body>
<div class="admin-wrap">

    <header class="admin-head">
        <div>
            <h1>Minnie Design — Orders</h1>
            <p class="muted">Total orders: <?= count($orders) ?></p>
        </div>
        <a href="admin.php?logout=1">Log out</a>
    </header>

    <?php if ($notice !== ""): ?>
        <p class="notice"><?= h($notice) ?></p>
    <?php endif; ?>

    <?php if ($error !== ""): ?>
        <p class="error"><?= h($error) ?></p>
    <?php endif; ?>

    <?php if (!$orders): ?>
        <div class="order-card">
            <h2>No orders yet</h2>
            <p>New customer orders will appear here.</p>
        </div>
    <?php endif; ?>

    <?php foreach ($orders as $order): ?>
        <section class="order-card">

            <h2>Order <?= h($order["order_number"]) ?></h2>
            <p class="muted">
                Created: <?= h($order["created_at"]) ?>
            </p>

            <div class="details">
                <div class="detail">
                    <strong>Customer</strong><br>
                    <?= h($order["customer_name"]) ?><br>
                    <?= h($order["customer_phone"]) ?><br>
                    <?= h($order["customer_email"]) ?>
                </div>

                <div class="detail">
                    <strong>Delivery address</strong><br>
                    <?= h($order["shipping_city"]) ?><br>
                    <?= h($order["shipping_address"]) ?><br>
                    <?= h($order["shipping_notes"]) ?>
                </div>

                <div class="detail">
                    <strong>Payment</strong><br>
                    Method: <?= h($order["payment_method"]) ?><br>
                    Payment status:
                    <span class="status">
                        <?= h($order["payment_status"]) ?>
                    </span><br>

                    Order status:
                    <span class="status">
                        <?= h($order["order_status"]) ?>
                    </span><br>

                    <?php if (!empty($order["payment_reference"])): ?>
                        Reference: <?= h($order["payment_reference"]) ?><br>
                    <?php endif; ?>

                    <?php if (!empty($order["proof_review_status"])): ?>
                        Proof review:
                        <?= h($order["proof_review_status"]) ?>
                    <?php endif; ?>

                    <?php if (!empty($order["payment_proof"])): ?>
                        <br>
                        <span class="muted">
                            A payment screenshot is attached to this order.
                        </span>
                        <br>
                        <span class="muted">
                            Proof review status:
                            <?= h($order["proof_review_status"]) ?>
                        </span>
                    <?php endif; ?>
                </div>

                <div class="detail">
                    <strong>Totals</strong><br>
                    Subtotal: <?= egp($order["subtotal"]) ?><br>
                    Shipping: <?= egp($order["shipping_fee"]) ?><br>
                    <strong>Total: <?= egp($order["total"]) ?></strong>
                </div>
            </div>

            <?php
            $itemsStmt->execute([$order["id"]]);
            $items = $itemsStmt->fetchAll();
            ?>

            <h3>Products</h3>

            <?php if (!$items): ?>
                <p class="muted">No product items found for this order.</p>
            <?php else: ?>
                <table class="items">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Options</th>
                            <th>Unit price</th>
                            <th>Qty</th>
                            <th>Line total</th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php foreach ($items as $item): ?>
                        <tr>
                            <td><?= h($item["product_name"]) ?></td>
                            <td>
                                <?php
                                $options = json_decode(
                                    (string)$item["customization_details"],
                                    true
                                );

                                if (is_array($options) && $options) {
                                    foreach ($options as $key => $value) {
                                        echo "<strong>"
                                            . h($key)
                                            . ":</strong> "
                                            . h(is_scalar($value) ? $value : "")
                                            . "<br>";
                                    }
                                } else {
                                    echo "—";
                                }
                                ?>
                            </td>
                            <td><?= egp($item["unit_price"]) ?></td>
                            <td><?= (int)$item["quantity"] ?></td>
                            <td><?= egp($item["line_total"]) ?></td>
                        </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>

            <form class="admin-form" method="post" action="admin.php">
                <h3>Manage order</h3>

                <input type="hidden" name="csrf_token"
                       value="<?= h($_SESSION["admin_csrf"]) ?>">

                <input type="hidden" name="order_id"
                       value="<?= (int)$order["id"] ?>">

                <label for="order-status-<?= (int)$order["id"] ?>">
                    Order status
                </label>

                <select
                    id="order-status-<?= (int)$order["id"] ?>"
                    name="order_status" required>
                    <?php foreach ($orderStatuses as $status): ?>
                        <option
                            value="<?= h($status) ?>"
                            <?= $status === $order["order_status"]
                                ? "selected" : "" ?>>
                            <?= h(ucwords(str_replace("_", " ", $status))) ?>
                        </option>
                    <?php endforeach; ?>
                </select>

                <label for="payment-status-<?= (int)$order["id"] ?>">
                    Payment status
                </label>

                <select
                    id="payment-status-<?= (int)$order["id"] ?>"
                    name="payment_status" required>
                    <?php foreach ($paymentStatuses as $status): ?>
                        <option
                            value="<?= h($status) ?>"
                            <?= $status === $order["payment_status"]
                                ? "selected" : "" ?>>
                            <?= h(ucwords(str_replace("_", " ", $status))) ?>
                        </option>
                    <?php endforeach; ?>
                </select>

                <br>
                <button type="submit" name="update_order" value="1">
                    Save changes
                </button>
            </form>

        </section>
    <?php endforeach; ?>

</div>
</body>
</html>
