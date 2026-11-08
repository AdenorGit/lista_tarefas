<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $titulo ?? "" ?></title>

    <!-- Logo ico -->
     <link rel="shortcut icon" href="/Assets/Img/Ico/favico.ico" type="image/x-icon">

    <!-- Styles correções -->
    <link rel="stylesheet" href="/Assets/Css/styles.css">

    <!-- Script js -->
    <?= $javascript ?? '' ?>

    <!-- Token -->
    <meta name="csrf-token" content="<?= htmlspecialchars($_SESSION['csrf_token'] ?? '', ENT_QUOTES, 'UTF-8') ?>">


</head>

<body>
