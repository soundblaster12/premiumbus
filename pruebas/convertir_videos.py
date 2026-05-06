"""
Convertidor de videos WebP → MP4 para PremiumBus
Alternativa sin ffmpeg: usa Pillow + imageio
Instalar: pip install Pillow imageio imageio-ffmpeg
Ejecutar: python convertir_videos.py
"""
import os
import sys

SRC_DIR = r"C:\Users\GAMER\.gemini\antigravity\brain\81ba8c2b-ed05-497b-85d1-2842c5896f30"
DST_DIR = r"c:\Users\GAMER\OneDrive\Documentos\PremiumBus\pruebas\videos"

VIDEOS = {
    "prueba_auth_login_1778014903570.webp":    "CP-AUTH-01_Login_Exitoso.mp4",
    "prueba_auth_xss_1778015048643.webp":      "CP-AUTH-02_Prevencion_XSS.mp4",
    "prueba_compra_exacto_1778015121888.webp":  "CP-COMPRA-01_Saldo_Exacto.mp4",
    "prueba_compra_rechazo_1778015211080.webp": "CP-COMPRA-02_Saldo_Insuficiente.mp4",
    "prueba_rol_admin_1778015326912.webp":      "CP-ROL-01_Restriccion_Admin.mp4",
    "prueba_directorio_1778015488729.webp":     "CP-ROL-02_Directorio_Usuarios.mp4",
    "prueba_ui_tokens_1778015586901.webp":      "CP-UI-01_Tokens_Diseno.mp4",
}

def convert_with_ffmpeg():
    """Intenta convertir usando ffmpeg directamente (más rápido)."""
    import subprocess
    os.makedirs(DST_DIR, exist_ok=True)
    
    converted = 0
    for src_name, dst_name in VIDEOS.items():
        src_path = os.path.join(SRC_DIR, src_name)
        dst_path = os.path.join(DST_DIR, dst_name)
        
        if not os.path.exists(src_path):
            print(f"  ⚠️  No encontrado: {src_name}")
            continue
        
        print(f"  🔄 {dst_name}...", end="", flush=True)
        result = subprocess.run(
            ["ffmpeg", "-y", "-i", src_path,
             "-c:v", "libx264", "-pix_fmt", "yuv420p",
             "-crf", "23", "-preset", "medium",
             "-movflags", "+faststart", dst_path],
            capture_output=True
        )
        if result.returncode == 0:
            size_kb = os.path.getsize(dst_path) // 1024
            print(f" ✅ ({size_kb} KB)")
            converted += 1
        else:
            print(" ❌")
    return converted


def convert_with_imageio():
    """Alternativa: convierte usando imageio (requiere pip install imageio imageio-ffmpeg Pillow)."""
    try:
        import imageio.v3 as iio
        from PIL import Image
    except ImportError:
        print("❌ Instala dependencias: pip install Pillow imageio imageio-ffmpeg")
        return 0
    
    os.makedirs(DST_DIR, exist_ok=True)
    converted = 0
    
    for src_name, dst_name in VIDEOS.items():
        src_path = os.path.join(SRC_DIR, src_name)
        dst_path = os.path.join(DST_DIR, dst_name)
        
        if not os.path.exists(src_path):
            print(f"  ⚠️  No encontrado: {src_name}")
            continue
        
        print(f"  🔄 {dst_name}...", end="", flush=True)
        try:
            # Leer frames del WebP animado
            img = Image.open(src_path)
            frames = []
            try:
                while True:
                    frame = img.copy().convert("RGB")
                    import numpy as np
                    frames.append(np.array(frame))
                    img.seek(img.tell() + 1)
            except EOFError:
                pass
            
            if not frames:
                print(" ❌ Sin frames")
                continue
            
            # Escribir MP4
            fps = max(1, min(10, 1000 // max(1, img.info.get("duration", 100))))
            writer = iio.imopen(dst_path, "w", plugin="pyav")
            writer.write(frames, codec="h264", fps=fps)
            
            size_kb = os.path.getsize(dst_path) // 1024
            print(f" ✅ ({size_kb} KB)")
            converted += 1
        except Exception as e:
            print(f" ❌ {e}")
    
    return converted


def main():
    print()
    print("🎬 Convertidor WebP → MP4 para PremiumBus")
    print("━" * 45)
    print()
    
    # Intentar con ffmpeg primero
    import shutil
    if shutil.which("ffmpeg"):
        print("✅ ffmpeg detectado — usando conversión directa")
        print()
        count = convert_with_ffmpeg()
    else:
        print("⚠️  ffmpeg no encontrado — usando imageio como alternativa")
        print("   (Para mejor calidad instala ffmpeg: winget install ffmpeg)")
        print()
        count = convert_with_imageio()
    
    print()
    print("━" * 45)
    print(f"✅ {count} videos convertidos a MP4")
    print(f"📁 Ubicación: {DST_DIR}")
    print()


if __name__ == "__main__":
    main()
