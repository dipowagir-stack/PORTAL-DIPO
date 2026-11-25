<?php

// Izinkan akses dari frontend (sesuaikan domain jika perlu)

header('Access-Control-Allow-Origin: *');

header('Access-Control-Allow-Methods: POST, OPTIONS');

header('Access-Control-Allow-Headers: Content-Type');

header('Content-Type: application/json');



if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

exit(0);

}



if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {

$targetDir = "uploads/";

if (!file_exists($targetDir)) {

mkdir($targetDir, 0755, true);

}



// Validasi tipe file (hanya izinkan gambar)

$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

$fileType = mime_content_type($_FILES['file']['tmp_name']);



if (!in_array($fileType, $allowedTypes)) {

http_response_code(400);

echo json_encode(["status" => "error", "message" => "Format file harus JPG, PNG, WEBP, atau GIF."]);

exit;

}



$ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));

$fileName = time() . '_' . uniqid() . '.' . $ext;

$targetFile = $targetDir . $fileName;



if (move_uploaded_file($_FILES['file']['tmp_name'], $targetFile)) {

// Otomatis mendeteksi protokol dan nama domain aktif

$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";

$domain = $_SERVER['HTTP_HOST'];

$fileUrl = $protocol . $domain . "/" . $targetFile;



echo json_encode([

"status" => "success",

"url" => $fileUrl

]);

} else {

http_response_code(500);

echo json_encode(["status" => "error", "message" => "Gagal menyimpan gambar ke server."]);

}

} else {

http_response_code(400);

echo json_encode(["status" => "error", "message" => "File tidak ditemukan."]);

}

?>
