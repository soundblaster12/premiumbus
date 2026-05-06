# ═══════════════════════════════════════════════════════
# Convertidor de videos WebP → MP4 para PremiumBus
# Requiere: ffmpeg (instalar con: winget install ffmpeg)
# Ejecutar: .\convertir_videos.ps1
# ═══════════════════════════════════════════════════════

$srcDir = "C:\Users\GAMER\.gemini\antigravity\brain\81ba8c2b-ed05-497b-85d1-2842c5896f30"
$dstDir = "c:\Users\GAMER\OneDrive\Documentos\PremiumBus\pruebas\videos"

# Crear directorio de salida
New-Item -ItemType Directory -Path $dstDir -Force | Out-Null

# Mapeo: archivo WebP original → nombre MP4 descriptivo
$videos = @{
    "prueba_auth_login_1778014903570.webp"    = "CP-AUTH-01_Login_Exitoso.mp4"
    "prueba_auth_xss_1778015048643.webp"      = "CP-AUTH-02_Prevencion_XSS.mp4"
    "prueba_compra_exacto_1778015121888.webp"  = "CP-COMPRA-01_Saldo_Exacto.mp4"
    "prueba_compra_rechazo_1778015211080.webp" = "CP-COMPRA-02_Saldo_Insuficiente.mp4"
    "prueba_rol_admin_1778015326912.webp"      = "CP-ROL-01_Restriccion_Admin.mp4"
    "prueba_directorio_1778015488729.webp"     = "CP-ROL-02_Directorio_Usuarios.mp4"
    "prueba_ui_tokens_1778015586901.webp"      = "CP-UI-01_Tokens_Diseno.mp4"
}

Write-Host ""
Write-Host "🎬 Convertidor WebP → MP4 para PremiumBus" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

# Verificar ffmpeg
$ffmpegPath = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpegPath) {
    Write-Host "❌ ffmpeg no encontrado. Instálalo con:" -ForegroundColor Red
    Write-Host "   winget install ffmpeg" -ForegroundColor Yellow
    Write-Host "   O descárgalo de: https://ffmpeg.org/download.html" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternativa: ejecuta el script Python 'convertir_videos.py'" -ForegroundColor Gray
    exit 1
}

$converted = 0
$failed = 0

foreach ($entry in $videos.GetEnumerator()) {
    $srcFile = Join-Path $srcDir $entry.Key
    $dstFile = Join-Path $dstDir $entry.Value

    if (-not (Test-Path $srcFile)) {
        Write-Host "⚠️  No encontrado: $($entry.Key)" -ForegroundColor Yellow
        $failed++
        continue
    }

    Write-Host "🔄 Convirtiendo: $($entry.Value)..." -ForegroundColor White -NoNewline

    # ffmpeg: WebP animado → MP4 (H.264, buena calidad, compatible universalmente)
    & ffmpeg -y -i $srcFile -c:v libx264 -pix_fmt yuv420p -crf 23 -preset medium -movflags +faststart $dstFile 2>$null

    if ($LASTEXITCODE -eq 0) {
        $size = [math]::Round((Get-Item $dstFile).Length / 1KB)
        Write-Host " ✅ (${size} KB)" -ForegroundColor Green
        $converted++
    } else {
        Write-Host " ❌ Error" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "✅ Convertidos: $converted  |  ❌ Fallidos: $failed" -ForegroundColor Cyan
Write-Host "📁 Videos en: $dstDir" -ForegroundColor Green
Write-Host ""
