
<?php
session_start();
require_once __DIR__ . "/config/db.php";

$order = null;
$error = "";
$orderNumber = "";
$phone = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $orderNumber = trim($_POST["order_number"] ?? "");
    $phone = trim($_POST["phone"] ?? "");

    if ($orderNumber === "" || $phone === "") {
        $error = "Please enter your order number and phone number.";
    } else {
        try {
            $stmt = $pdo->prepare(
                "SELECT order_number, customer_name, customer_phone,
                        order_status, payment_status, payment_method,
                        total, created_at
                 FROM orders
                 WHERE order_number = ?
                   AND customer_phone = ?
                 LIMIT 1"
            );

            $stmt->execute([$orderNumber, $phone]);
            $order = $stmt->fetch();

            if (!$order) {
                $error = "We couldn't find an order matching these details.";
            }
        } catch (PDOException $e) {
            error_log("Order tracking failed: " . $e->getMessage());
            $error = "Something went wrong. Please try again later.";
        }
    }
}

function e($value) {
    return htmlspecialchars((string)$value, ENT_QUOTES, "UTF-8");
}

$statusLabels = [
    "pending" => "Order received",
    "preparing" => "Preparing your order",
    "processing" => "Processing your order",
    "shipped" => "Shipped",
    "delivered" => "Delivered",
    "cancelled" => "Cancelled"
];

$currentStatus = strtolower((string)($order["order_status"] ?? "pending"));

$steps = [
    "pending" => "Order received",
    "preparing" => "Preparing",
    "shipped" => "Shipped",
    "delivered" => "Delivered"
];

$progress = [
    "pending" => 1,
    "processing" => 1,
    "preparing" => 2,
    "shipped" => 3,
    "delivered" => 4
];

$currentStep = $progress[$currentStatus] ?? 0;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Track Your Order | Minnie Design</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
    <link rel="stylesheet" href="style.css">

    <style>
        .tracking-page {
            max-width: 900px;
            margin: 50px auto 70px;
            padding: 0 20px;
        }

        .tracking-card {
            background: var(--card, #fff);
            border: 1px solid rgba(150,62,102,.16);
            border-radius: 22px;
            padding: clamp(22px, 4vw, 38px);
            margin-bottom: 24px;
            box-shadow: 0 12px 35px rgba(80,35,60,.07);
        }

        .tracking-heading {
            text-align: center;
            margin-bottom: 28px;
        }

        .tracking-heading .tracking-icon {
            width: 66px;
            height: 66px;
            display: grid;
            place-items: center;
            margin: 0 auto 14px;
            border-radius: 50%;
            background: #fff0f6;
            color: #963e66;
            font-size: 26px;
        }

        .tracking-heading h1 {
            font-family: 'Playfair Display', serif;
            margin: 0 0 8px;
        }

        .tracking-heading p {
            margin: 0;
            opacity: .75;
        }

        .tracking-form {
            max-width: 560px;
            margin: 0 auto;
        }

        .tracking-form label {
            display: block;
            margin: 17px 0 7px;
            font-weight: 600;
        }

        .tracking-form input {
            width: 100%;
            padding: 13px 14px;
            border: 1px solid #dfc6d2;
            border-radius: 10px;
            font: inherit;
            background: transparent;
            color: inherit;
        }

        .tracking-form button {
            width: 100%;
            margin-top: 20px;
            cursor: pointer;
        }

        .back-home {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            margin-bottom: 22px;
            color: #963e66;
            text-decoration: none;
            font-weight: 600;
            transition: color .2s ease;
        }

        .back-home:hover {
            color: #c45d8b;
        }

        .tracking-error {
            max-width: 560px;
            margin: 18px auto 0;
            padding: 13px 15px;
            border-radius: 10px;
            color: #9e2634;
            background: #fff0f0;
        }

        .tracking-status {
            text-align: center;
            padding: 22px;
            border-radius: 16px;
            background: #fff1f7;
            margin-bottom: 28px;
        }

        .tracking-status small {
            display: block;
            color: #816b77;
        }

        .tracking-status strong {
            display: block;
            font-size: clamp(20px, 4vw, 27px);
            color: #963e66;
            margin: 7px 0;
        }

        .tracking-status .order-number {
            color: #816b77;
            overflow-wrap: anywhere;
        }

        .tracking-steps {
            margin-top: 20px;
        }

        .tracking-step {
            display: flex;
            gap: 14px;
            align-items: flex-start;
            padding: 14px 0;
        }

        .tracking-step .step-circle {
            flex: 0 0 32px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            background: #eee5ea;
            color: #786571;
        }

        .tracking-step.done .step-circle {
            background: #963e66;
            color: #fff;
        }

        .tracking-step p {
            margin: 5px 0 0;
            opacity: .72;
            font-size: 14px;
        }

        .tracking-details {
            border-top: 1px solid rgba(130,100,115,.25);
            margin-top: 22px;
            padding-top: 22px;
        }

        .tracking-details p {
            line-height: 1.9;
            overflow-wrap: anywhere;
        }

        .tracking-cancelled {
            color: #a32929;
            font-weight: 600;
        }

        @media (max-width: 600px) {
            .tracking-page {
                margin: 25px auto 40px;
                padding: 0 13px;
            }

            .tracking-card {
                border-radius: 16px;
            }
        }
        
/* Track Order — Dark Mode */
body.dark .tracking-card {
    background: var(--card, #211a20);
    color: #f6eaf0;
    border-color: rgba(230, 160, 195, 0.2);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
}

body.dark .tracking-heading p {
    color: #d2c0ca;
}

body.dark .tracking-heading .tracking-icon {
    background: #392433;
    color: #f0a6ca;
}

body.dark .back-home {
    color: #f0a6ca;
}

body.dark .back-home:hover {
    color: #ffc2df;
}

body.dark .tracking-form input {
    background: #2b222a;
    color: #fff4f8;
    border-color: #634456;
}

body.dark .tracking-form input::placeholder {
    color: #bba5b2;
}

body.dark .tracking-form input:focus {
    outline: 2px solid #d985b0;
    outline-offset: 2px;
}

body.dark .tracking-status {
    background: #352432;
    border: 1px solid rgba(240, 166, 202, 0.15);
}

body.dark .tracking-status small,
body.dark .tracking-status .order-number {
    color: #d7c1ce;
}

body.dark .tracking-status strong {
    color: #f0a6ca;
}

body.dark .tracking-step .step-circle {
    background: #40333e;
    color: #d7c1ce;
}

body.dark .tracking-step.done .step-circle {
    background: #bd6795;
    color: #fff;
}

body.dark .tracking-step p {
    color: #cdbbc6;
}

body.dark .tracking-details {
    border-top-color: #51414d;
}

body.dark .tracking-error {
    background: #44272e;
    color: #ffc4cb;
}

body.dark .tracking-cancelled {
    color: #ffadb5;
}

body.dark .tracking-form label {
    color: #f6eaf0;
}

    </style>
</head>

<body>
<main class="tracking-page">
    <section class="tracking-card">
        <a href="index.html" class="back-home">
            <i class="fa-solid fa-arrow-left"></i>
            Back to Home
        </a>

        <div class="tracking-heading">
            <div class="tracking-icon">
                <i class="fa-solid fa-box-open"></i>
            </div>

            <h1>Track Your Order</h1>
            <p>Follow your Minnie Design order from preparation to delivery.</p>
        </div>

        <form class="tracking-form" method="POST" action="">
            <label for="order_number">Order number</label>
            <input
                id="order_number"
                name="order_number"
                value="<?= e($orderNumber) ?>"
                placeholder="MD-XXXXXXXXXXXX"
                maxlength="40"
                required
            >

            <label for="phone">Phone number used for the order</label>
            <input
                id="phone"
                name="phone"
                type="tel"
                value="<?= e($phone) ?>"
                maxlength="25"
                autocomplete="tel"
                required
            >

            <button class="btn btn-solid" type="submit">
                <i class="fa-solid fa-magnifying-glass"></i>
                Track Order
            </button>
        </form>

        <?php if ($error !== ""): ?>
            <div class="tracking-error" role="alert">
                <?= e($error) ?>
            </div>
        <?php endif; ?>
    </section>

    <?php if ($order): ?>
        <section class="tracking-card">
            <div class="tracking-status">
                <small>Current order status</small>
                <strong>
                    <?= e($statusLabels[$currentStatus] ?? ucfirst($currentStatus)) ?>
                </strong>
                <span class="order-number">
                    Order #<?= e($order["order_number"]) ?>
                </span>
            </div>

            <?php if ($currentStatus === "cancelled"): ?>
                <p class="tracking-cancelled">
                    This order has been cancelled.
                </p>
            <?php else: ?>
                <h2>Order Progress</h2>

                <div class="tracking-steps">
                    <?php
                    $descriptions = [
                        "pending" => "Your order has been received.",
                        "preparing" => "Your order is being prepared.",
                        "shipped" => "Your order is on its way.",
                        "delivered" => "Your order has been delivered."
                    ];

                    $index = 0;
                    foreach ($steps as $key => $label):
                        $index++;
                    ?>
                        <div class="tracking-step <?= $currentStep >= $index ? 'done' : '' ?>">
                            <div class="step-circle">
                                <?= $currentStep >= $index
                                    ? '<i class="fa-solid fa-check"></i>'
                                    : $index ?>
                            </div>

                            <div>
                                <strong><?= e($label) ?></strong>
                                <p><?= e($descriptions[$key]) ?></p>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <div class="tracking-details">
                <h2>Order Details</h2>

                <p>
                    <strong>Customer:</strong>
                    <?= e($order["customer_name"]) ?><br>

                    <strong>Total:</strong>
                    <?= e(number_format((float)$order["total"], 2)) ?> EGP<br>

                    <strong>Payment method:</strong>
                    <?= e(ucwords(str_replace("_", " ", $order["payment_method"]))) ?><br>

                    <strong>Payment status:</strong>
                    <?= e(ucfirst($order["payment_status"])) ?>
                </p>

                <p class="muted">
                    To see the latest status, submit your order details again.
                </p>
            </div>
        </section>
    <?php endif; ?>
</main>

<script src="products.js"></script>
<script src="app.js"></script>
</body>
</html>
