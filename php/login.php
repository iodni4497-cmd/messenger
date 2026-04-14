<?php
require_once 'config.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        $error = 'All fields are required';
    } else {
        try {
            $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$username, $username]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                
                $stmt = $pdo->prepare("UPDATE users SET status = 'online' WHERE id = ?");
                $stmt->execute([$user['id']]);
                
                header("Location: index.html");
                exit;
            } else {
                $error = 'Invalid username or password';
            }
        } catch(PDOException $e) {
            $error = 'Login failed: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Messenger</title>
    <link rel="stylesheet" href="auth-style.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-box">
            <h1>Welcome Back</h1>
            
            <?php if ($error): ?>
                <div class="alert error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            
            <form method="POST" action="">
                <div class="form-group">
                    <label>Username or Email</label>
                    <input type="text" name="username" required value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>">
                </div>
                
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" name="password" required>
                </div>
                
                <button type="submit" class="btn-primary">Login</button>
            </form>
            
            <p class="auth-link">Don't have an account? <a href="register.php">Register</a></p>
        </div>
    </div>
</body>
</html>
