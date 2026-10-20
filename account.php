
<?php
session_start();

// لازم المستخدم يكون عامل Login
if (!isset($_SESSION["user_id"])) {
    header("Location: login.php");
    exit;
}

// عرض الاسم الكامل للمستخدم
$fullName = $_SESSION["user_name"] ?? "My Account";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>My Account | Minnie Design</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">

    <style>
        :root {
            --pink: #d986a5;
            --pink-dark: #b95f83;
            --pink-light: #fff0f5;

            --text: #30242b;
            --muted: #887680;

            --white: #ffffff;
            --page-start: #fff8fb;
            --page-end: #fbeaf1;
            --border: #eee1e7;

            --shadow: rgba(130, 68, 94, 0.10);
        }

        /* Dark Mode colors */
        body.dark {
            --text: #f8eaf0;
            --muted: #c4aab6;

            --white: #2b2229;
            --page-start: #211921;
            --page-end: #30212b;
            --pink-light: #49303e;
            --border: #59414f;

            --shadow: rgba(0, 0, 0, 0.22);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            min-height: 100vh;
            font-family: "Poppins", sans-serif;
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

            display: flex;
            flex-direction: column;

            transition:
                background 0.3s ease,
                color 0.3s ease;
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

        a {
            text-decoration: none;
            color: inherit;
        }

        button {
            font-family: inherit;
        }

        /* Header */
        .topbar {
            width: 100%;
            min-height: 82px;
            padding: 18px 7%;

            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;

            border-bottom: 1px solid var(--border);
            background: var(--white);

            transition:
                background 0.3s ease,
                border-color 0.3s ease;
        }

        .logo {
            font-size: 25px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: var(--pink-dark);
        }

        .logo span {
            color: var(--text);
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

            color: var(--text);
            font-size: 14px;
            font-weight: 500;

            transition: color 0.25s ease;
        }

        .back-home:hover {
            color: var(--pink-dark);
        }

        /* Dark Mode button */
        .theme-toggle {
            width: 42px;
            height: 42px;

            display: grid;
            place-items: center;

            border: 1px solid var(--border);
            border-radius: 50%;

            background: var(--white);
            color: var(--pink-dark);

            cursor: pointer;
            font-size: 17px;

            transition:
                transform 0.25s ease,
                background 0.3s ease,
                color 0.3s ease;
        }

        .theme-toggle:hover {
            transform: translateY(-2px);
        }

        /* Main */
        main {
            flex: 1;

            width: 100%;
            padding: 65px 20px;

            display: flex;
            justify-content: center;
            align-items: center;
        }

        .account-card {
            width: 100%;
            max-width: 540px;

            padding: 45px 40px;

            background: var(--white);
            border: 1px solid rgba(217, 134, 165, 0.2);
            border-radius: 24px;

            box-shadow: 0 18px 60px var(--shadow);

            text-align: center;

            transition:
                background 0.3s ease,
                border-color 0.3s ease,
                box-shadow 0.3s ease;
        }

        .profile-icon {
            width: 92px;
            height: 92px;

            margin: 0 auto 22px;

            display: grid;
            place-items: center;

            border-radius: 50%;
            border: 5px solid var(--pink-light);

            background: linear-gradient(
                135deg,
                #f9dce7,
                #e9a9c1
            );

            color: var(--pink-dark);
            font-size: 35px;
        }

        body.dark .profile-icon {
            background: linear-gradient(
                135deg,
                #49303e,
                #684153
            );
            border-color: #49303e;
            color: #f4b6ce;
        }

        .welcome-label {
            margin-bottom: 8px;

            color: var(--pink-dark);
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        h1 {
            margin-bottom: 12px;

            color: var(--text);
            font-size: clamp(25px, 5vw, 32px);
            font-weight: 600;
            overflow-wrap: anywhere;
        }

        .description {
            max-width: 350px;
            margin: 0 auto 30px;

            color: var(--muted);
            font-size: 14px;
            line-height: 1.8;
        }

        .status {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;

            margin-bottom: 30px;
            padding: 9px 16px;

            border-radius: 30px;
            background: #e9f8ed;
            color: #34834b;

            font-size: 12px;
            font-weight: 500;
        }

        body.dark .status {
            background: #243d2d;
            color: #a9e4b8;
        }

        /* Buttons */
        .account-actions {
            display: flex;
            flex-direction: column;
            gap: 13px;
        }

        .btn {
            width: 100%;
            min-height: 49px;
            padding: 13px 20px;

            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;

            border: 1px solid transparent;
            border-radius: 12px;

            font-size: 14px;
            font-weight: 500;

            cursor: pointer;

            transition:
                transform 0.25s ease,
                background 0.25s ease,
                color 0.25s ease,
                border-color 0.25s ease;
        }

        .btn:hover {
            transform: translateY(-2px);
        }

        .btn-primary {
            background: linear-gradient(
                135deg,
                var(--pink),
                var(--pink-dark)
            );
            color: #ffffff;
        }

        .btn-primary:hover {
            box-shadow: 0 8px 20px rgba(185, 95, 131, 0.2);
        }

        .btn-secondary {
            background: var(--white);
            color: var(--text);
            border-color: var(--border);
        }

        .btn-secondary:hover {
            background: var(--pink-light);
            border-color: var(--pink);
        }

        .btn-logout {
            margin-top: 5px;

            background: transparent;
            color: #c65f75;
            border-color: #edc5d0;
        }

        .btn-logout:hover {
            background: rgba(217, 134, 165, 0.1);
        }

        /* Footer */
        footer {
            padding: 22px 15px;

            color: var(--muted);
            text-align: center;
            font-size: 12px;

            border-top: 1px solid var(--border);
        }

        footer span {
            color: var(--pink-dark);
            font-weight: 600;
        }

        /* Mobile */
        @media (max-width: 480px) {
            .topbar {
                min-height: 72px;
                padding: 15px 5%;
            }

            .logo {
                font-size: 21px;
            }

            .topbar-actions {
                gap: 12px;
            }

            .back-home {
                font-size: 12px;
                gap: 6px;
            }

            .theme-toggle {
                width: 36px;
                height: 36px;
                font-size: 15px;
            }

            main {
                padding: 35px 16px;
            }

            .account-card {
                padding: 35px 22px;
                border-radius: 20px;
            }

            .profile-icon {
                width: 80px;
                height: 80px;
                font-size: 30px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                transition: none !important;
            }
        }
    </style>
</head>

<body>

    <header class="topbar">
        <a href="index.html" class="logo">
            Minnie <span>Design</span>
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
                aria-label="Switch to dark mode"
                aria-pressed="false"
            >
                <i class="fa-solid fa-moon"></i>
            </button>
        </div>
    </header>

    <main>
        <section class="account-card">

            <div class="profile-icon">
                <i class="fa-regular fa-user"></i>
            </div>

            <p class="welcome-label">MY ACCOUNT</p>

            <h1>
                Welcome,
                <?= htmlspecialchars($fullName, ENT_QUOTES, 'UTF-8') ?>!
            </h1>

            <p class="description">
                We're happy to have you here.
                Manage your profile and keep your Minnie Design
                account up to date.
            </p>

            <div class="status">
                <i class="fa-solid fa-circle-check"></i>
                You're successfully logged in
            </div>

            <div class="account-actions">

                <a href="edit_profile.php" class="btn btn-primary">
                    <i class="fa-regular fa-pen-to-square"></i>
                    Edit My Profile
                </a>

                <a href="index.html" class="btn btn-secondary">
                    <i class="fa-solid fa-house"></i>
                    Back to Home
                </a>

                <a href="logout.php" class="btn btn-logout">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    Logout
                </a>

            </div>
        </section>
    </main>

    <footer>
        Made with <span>♥</span> by Minnie Design
    </footer>

    <script>
        (() => {
            const themeBtn = document.getElementById("themeBtn");

            function applyTheme(isDark) {
                document.body.classList.toggle("dark", isDark);

                themeBtn.innerHTML = isDark
                    ? '<i class="fa-solid fa-sun"></i>'
                    : '<i class="fa-solid fa-moon"></i>';

                themeBtn.setAttribute("aria-pressed", String(isDark));

                themeBtn.setAttribute(
                    "aria-label",
                    isDark ? "Switch to light mode" : "Switch to dark mode"
                );
            }

            // Use the saved theme from the other pages
            applyTheme(localStorage.getItem("theme") === "dark");

            themeBtn.addEventListener("click", () => {
                const isDark = !document.body.classList.contains("dark");

                localStorage.setItem("theme", isDark ? "dark" : "light");

                applyTheme(isDark);
            });
        })();
    </script>

</body>
</html>
