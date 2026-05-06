## Videos de Pruebas — PremiumBus

Los videos de evidencia se encuentran en la siguiente ruta:

```
C:\Users\GAMER\.gemini\antigravity\brain\81ba8c2b-ed05-497b-85d1-2842c5896f30\
```

### Archivos de video (.webp animado):

| # | Prueba | Archivo |
|---|--------|---------|
| 1 | CP-AUTH-01 | prueba_auth_login_1778014903570.webp |
| 2 | CP-AUTH-02 | prueba_auth_xss_1778015048643.webp |
| 3 | CP-COMPRA-01 | prueba_compra_exacto_1778015121888.webp |
| 4 | CP-COMPRA-02 | prueba_compra_rechazo_1778015211080.webp |
| 5 | CP-ROL-01 | prueba_rol_admin_1778015326912.webp |
| 6 | CP-ROL-02 | prueba_directorio_1778015488729.webp |
| 7 | CP-UI-01 | prueba_ui_tokens_1778015586901.webp |

### Para copiar los videos a la carpeta de pruebas, ejecuta:

```powershell
$src = "C:\Users\GAMER\.gemini\antigravity\brain\81ba8c2b-ed05-497b-85d1-2842c5896f30"
$dst = "c:\Users\GAMER\OneDrive\Documentos\PremiumBus\pruebas\videos"
New-Item -ItemType Directory -Path $dst -Force
Copy-Item "$src\prueba_auth_login_*.webp" "$dst\CP-AUTH-01_Login_Exitoso.webp"
Copy-Item "$src\prueba_auth_xss_*.webp" "$dst\CP-AUTH-02_Prevencion_XSS.webp"
Copy-Item "$src\prueba_compra_exacto_*.webp" "$dst\CP-COMPRA-01_Saldo_Exacto.webp"
Copy-Item "$src\prueba_compra_rechazo_*.webp" "$dst\CP-COMPRA-02_Saldo_Insuficiente.webp"
Copy-Item "$src\prueba_rol_admin_*.webp" "$dst\CP-ROL-01_Restriccion_Admin.webp"
Copy-Item "$src\prueba_directorio_*.webp" "$dst\CP-ROL-02_Directorio_Usuarios.webp"
Copy-Item "$src\prueba_ui_tokens_*.webp" "$dst\CP-UI-01_Tokens_Diseño.webp"
Write-Host "✅ Videos copiados a $dst"
```
