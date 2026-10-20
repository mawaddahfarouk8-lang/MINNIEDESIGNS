
<?php
session_start();
require_once __DIR__ . "/config/db.php";

$error = "";
$email = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email = trim($_POST["email"] ?? "");
    $password = $_POST["password"] ?? "";

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = "Please enter a valid email address.";
    } else {
        $stmt = $pdo->prepare(
            "SELECT id, full_name, email, password_hash, role, is_active
             FROM users
             WHERE email = ?
             LIMIT 1"
        );

        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (
            $user &&
            (int) $user["is_active"] === 1 &&
            password_verify($password, $user["password_hash"])
        ) {
            session_regenerate_id(true);

            $_SESSION["user_id"] = $user["id"];
            $_SESSION["user_name"] = $user["full_name"];
            $_SESSION["user_email"] = $user["email"];
            $_SESSION["user_role"] = $user["role"];

            header("Location: index.html");
            exit;
        }

        $error = "Invalid email or password.";
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Login | Minnie Design</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
        rel="stylesheet"
    >

    <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
    >

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --pink: #d986a5;
            --pink-dark: #b95f83;
            --pink-light: #fff0f5;
            --text: #30242b;
            --muted: #887680;
            --white: #ffffff;
            --page-start: #fff8fb;
            --page-end: #fbeaf1;
            --field: #ffffff;
            --border: #eee1e7;
            --shadow: rgba(130, 68, 94, 0.10);
        }

        body.dark {
            --text: #f8eaf0;
            --muted: #c4aab6;
            --white: #2b2229;
            --page-start: #211921;
            --page-end: #30212b;
            --field: #362a33;
            --border: #59414f;
            --shadow: rgba(0, 0, 0, 0.22);
            --pink-light: #49303e;
        }

        body {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            font-family: 'Poppins', sans-serif;
            color: var(--text);

            background:
                radial-gradient(
                    circle at top left,
                    rgba(248, 220, 231, 0.85),
                    transparent 38%
                ),
                linear-gradient(
                    135deg,
                    var(--page-start),
                    var(--page-end)
                );

            transition: background 0.3s ease, color 0.3s ease;
        }

        body.dark {
            background:
                radial-gradient(
                    circle at top left,
                    #49303e,
                    transparent 42%
                ),
                linear-gradient(
                    135deg,
                    var(--page-start),
                    var(--page-end)
                );
        }

        /* Header */

        .topbar {
            width: 100%;
            padding: 22px 7%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
        }

        .logo {
            color: var(--text);
            text-decoration: none;
            font-size: 25px;
            font-weight: 700;
            letter-spacing: -1px;
        }

        .logo span {
            color: var(--pink-dark);
        }

        .topbar-actions {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .back-home {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            color: var(--pink-dark);
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            transition: 0.25s ease;
        }

        .back-home:hover {
            transform: translateX(-4px);
        }

        .theme-toggle {
            width: 40px;
            height: 40px;
            display: grid;
            place-items: center;
            border: 1px solid var(--border);
            border-radius: 50%;
            background: var(--white);
            color: var(--pink-dark);
            cursor: pointer;
            font-size: 16px;
            transition: 0.25s ease;
        }

        .theme-toggle:hover {
            transform: translateY(-2px);
        }

        /* Main */

        main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 35px 20px 55px;
        }

        .login-card {
            width: 100%;
            max-width: 510px;
            padding: 42px 38px;
            background: var(--white);
            border: 1px solid rgba(217, 134, 165, 0.2);
            border-radius: 25px;
            box-shadow: 0 18px 60px var(--shadow);
            animation: appear 0.6s ease both;
            transition: background 0.3s ease, color 0.3s ease;
        }

        @keyframes appear {
            from {
                opacity: 0;
                transform: translateY(18px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .profile-icon {
            width: 100px;
            height: 100px;
            margin: 0 auto 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 5px solid var(--pink-light);
            border-radius: 50%;
            background: linear-gradient(135deg, #fde6ef, #f6cbdc);
            color: var(--pink-dark);
            font-size: 36px;
            box-shadow: 0 8px 25px rgba(185, 95, 131, 0.12);
        }

        .eyebrow {
            margin-bottom: 10px;
            color: var(--pink-dark);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 3px;
            text-align: center;
            text-transform: uppercase;
        }

        h1 {
            margin-bottom: 10px;
            font-size: clamp(25px, 5vw, 31px);
            line-height: 1.4;
            text-align: center;
        }

        .subtitle {
            margin-bottom: 26px;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.8;
            text-align: center;
        }

        /* Error */

        .error {
            margin-bottom: 18px;
            padding: 12px 14px;
            border-radius: 10px;
            background: #fff0f0;
            color: #a32121;
            font-size: 13px;
            line-height: 1.7;
        }

        /* Form */

        .form-group {
            margin-bottom: 18px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: 600;
        }

        .input-wrap {
            position: relative;
        }

        .input-wrap > i {
            position: absolute;
            top: 50%;
            left: 15px;
            color: var(--pink-dark);
            transform: translateY(-50%);
            pointer-events: none;
        }

        input {
            width: 100%;
            min-height: 49px;
            padding: 12px 14px 12px 43px;
            border: 1px solid var(--border);
            border-radius: 11px;
            background: var(--field);
            color: var(--text);
            font-family: inherit;
            font-size: 14px;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        input:focus {
            outline: none;
            border-color: var(--pink);
            box-shadow: 0 0 0 3px rgba(217, 134, 165, 0.13);
        }

        /* Buttons */

        .actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 28px;
        }

        .btn {
            width: 100%;
            min-height: 49px;
            padding: 13px 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            border: 1px solid var(--border);
            border-radius: 12px;
            font-family: inherit;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            text-decoration: none;
            cursor: pointer;
            transition: 0.25s ease;
        }

        .btn-primary {
            background: var(--pink);
            border-color: var(--pink);
            color: white;
            box-shadow: 0 7px 18px rgba(185, 95, 131, 0.18);
        }

        .btn-primary:hover {
            background: var(--pink-dark);
            border-color: var(--pink-dark);
            transform: translateY(-2px);
        }

        .btn-secondary {
            background: var(--white);
            color: var(--text);
        }

        .btn-secondary:hover {
            background: var(--pink-light);
            border-color: #e9b6cb;
        }

        .links {
            margin-top: 24px;
            color: var(--muted);
            font-size: 13px;
            text-align: center;
        }

        .links a {
            color: var(--pink-dark);
            font-weight: 600;
            text-decoration: none;
        }

        .links a:hover {
            text-decoration: underline;
        }

        .footer {
            padding: 20px;
            color: var(--muted);
            font-size: 12px;
            text-align: center;
        }

        .footer span {
            color: var(--pink-dark);
            font-weight: 600;
        }

        @media (max-width: 480px) {
            .topbar {
                padding: 20px;
            }

            .logo {
                font-size: 21px;
            }

            .topbar-actions {
                gap: 12px;
            }

            .back-home {
                font-size: 12px;
            }

            .theme-toggle {
                width: 36px;
                height: 36px;
            }

            main {
                padding: 20px 16px 35px;
            }

            .login-card {
                padding: 32px 22px;
                border-radius: 20px;
            }

            .profile-icon {
                width: 85px;
                height: 85px;
                font-size: 31px;
            }
        }
    </style>
</head>

<body>

    <header class="topbar">
        <a href="index.html" class="logo">
            Minnie<span>Design</span>
        </a>

        <div class="topbar-actions">
            <a href="index.html" class="back-home">
                <i class="fa-solid fa-arrow-left"></i>
                Back to Home
            </a>

            <button
                type="button"
                class="theme-toggle"
                id="themeBtn"
                aria-label="Toggle dark mode"
                aria-pressed="false"
            >
                <i class="fa-solid fa-moon"></i>
            </button>
        </div>
    </header>

    <main>
        <section class="login-card">

            <div class="profile-icon">
                <i class="fa-regular fa-user"></i>
            </div>

            <p class="eyebrow">Minnie Design</p>

            <h1>Welcome Back</h1>

            <p class="subtitle">
                Login to your account and discover something special.
            </p>

            <?php if ($error !== ""): ?>
                <p class="error" role="alert">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <?= htmlspecialchars($error, ENT_QUOTES, "UTF-8") ?>
                </p>
            <?php endif; ?>

            <form method="POST" action="">

                <div class="form-group">
                    <label for="email">Email Address</label>

                    <div class="input-wrap">
                        <i class="fa-regular fa-envelope"></i>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            maxlength="190"
                            value="<?= htmlspecialchars($email, ENT_QUOTES, "UTF-8") ?>"
                            placeholder="Enter your email"
                            autocomplete="email"
                            required
                        >
                    </div>
                </div>

                <div class="form-group">
                    <label for="password">Password</label>

                    <div class="input-wrap">
                        <i class="fa-solid fa-lock"></i>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            autocomplete="current-password"
                            required
                        >
                    </div>
                </div>

                <div class="actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i>
                        Login
                    </button>

                    <a href="index.html" class="btn btn-secondary">
                        <i class="fa-solid fa-house"></i>
                        Back to Home
                    </a>
                </div>

            </form>

            <div class="links">
                Don't have an account?
                <a href="signup.php">Create Account</a>
            </div>

        </section>
    </main>

    <footer class="footer">
        Made with love by <span>Minnie Design</span> © 2026
    </footer>

    <script>
        /* Shared theme preference */
        (() => {
            const btn = document.getElementById("themeBtn");

            function applyTheme(isDark) {
                document.body.classList.toggle("dark", isDark);

                btn.innerHTML = `
                    <i class="fa-solid ${
                        isDark ? "fa-sun" : "fa-moon"
                    }"></i>
                `;

                btn.setAttribute("aria-pressed", String(isDark));

                btn.setAttribute(
                    "aria-label",
                    isDark ? "Switch to light mode" : "Switch to dark mode"
                );
            }

            applyTheme(localStorage.getItem("theme") === "dark");

            btn.addEventListener("click", () => {
                const isDark = !document.body.classList.contains("dark");

                localStorage.setItem("theme", isDark ? "dark" : "light");
                applyTheme(isDark);
            });
        })();
    </script>

</body>
</html>
