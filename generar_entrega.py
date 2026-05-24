"""
generar_entrega.py — Presentación "Entrega del Sistema" PremiumBus
Ejecutar: pip install python-pptx && python generar_entrega.py
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Entrega_Sistema_PremiumBus.pptx")

# Colores
C_DARK = RGBColor(0x1A,0x3A,0x6B)
C_MED  = RGBColor(0x2B,0x5E,0xA7)
C_LT   = RGBColor(0x3B,0x82,0xF6)
WHITE  = RGBColor(0xFF,0xFF,0xFF)
G_DK   = RGBColor(0x33,0x33,0x33)
G_MD   = RGBColor(0x66,0x66,0x66)
G_LT   = RGBColor(0xF0,0xF2,0xF5)
GREEN  = RGBColor(0x10,0xB9,0x81)
SW, SH = Inches(13.333), Inches(7.5)

def bg(s, c=C_DARK):
    s.background.fill.solid(); s.background.fill.fore_color.rgb = c

def rect(s, l, t, w, h, c):
    sh = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, l, t, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = c; sh.line.fill.background()
    return sh

def rrect(s, l, t, w, h, c):
    sh = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = c; sh.line.fill.background()
    return sh

def txt(s, text, l, t, w, h, sz=36, c=WHITE, b=True, al=PP_ALIGN.LEFT):
    tb = s.shapes.add_textbox(l, t, w, h)
    tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.text = text
    p.font.size = Pt(sz); p.font.color.rgb = c; p.font.bold = b
    p.font.name = "Segoe UI"; p.alignment = al
    return tb

def bullets(s, items, l, t, w, h, sz=14, c=G_DK, sp=6):
    tb = s.shapes.add_textbox(l, t, w, h)
    tf = tb.text_frame; tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = item; p.font.size = Pt(sz); p.font.color.rgb = c
        p.font.name = "Segoe UI"; p.space_after = Pt(sp)
    return tb

def header(s, title):
    bg(s, WHITE)
    rect(s, Inches(0), Inches(0), SW, Inches(1.2), C_DARK)
    txt(s, title, Inches(0.8), Inches(0.25), Inches(11), Inches(0.8), 34, WHITE)
    rect(s, Inches(0), Inches(7.3), SW, Inches(0.2), C_LT)

# ── SLIDE 1: PORTADA ──
def slide1(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s, C_DARK)
    rect(s, Inches(0), Inches(0), SW, Inches(0.06), C_LT)
    rect(s, Inches(0), Inches(7.44), SW, Inches(0.06), C_LT)
    # Decorativo lateral
    rrect(s, Inches(10), Inches(1), Inches(3), Inches(6), C_MED)
    txt(s, "🚌", Inches(10.5), Inches(2.5), Inches(2), Inches(2), 72, WHITE, al=PP_ALIGN.CENTER)
    txt(s, "ENTREGA DEL SISTEMA", Inches(0.8), Inches(1.2), Inches(9), Inches(1), 48, WHITE)
    txt(s, "PremiumBus", Inches(0.8), Inches(2.2), Inches(9), Inches(0.8), 42, C_LT)
    txt(s, "Sistema de Gestión de Transporte Urbano — San Luis Potosí",
        Inches(0.8), Inches(3.2), Inches(9), Inches(0.6), 20, RGBColor(0xA0,0xC4,0xED), False)
    rect(s, Inches(0.8), Inches(4.0), Inches(2.5), Inches(0.04), C_LT)
    txt(s, "Materia: Ingeniería de Software", Inches(0.8), Inches(4.3), Inches(8), Inches(0.4), 18, RGBColor(0xD0,0xE0,0xF0), True)
    integrantes = [
        "👤 Integrante 1 — [Nombre completo]",
        "👤 Integrante 2 — [Nombre completo]",
        "👤 Integrante 3 — [Nombre completo]",
        "👤 Integrante 4 — [Nombre completo]",
    ]
    bullets(s, integrantes, Inches(0.8), Inches(4.9), Inches(8), Inches(2), 16, RGBColor(0xB0,0xCC,0xE8))
    txt(s, "Mayo 2026  •  Universidad Autónoma de San Luis Potosí",
        Inches(0.8), Inches(6.9), Inches(8), Inches(0.4), 13, RGBColor(0x80,0xA0,0xC0), False)

# ── SLIDE 2: INTRODUCCIÓN / PROBLEMA ──
def slide2(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    header(s, "📋 Introducción — Problema Abordado")
    rrect(s, Inches(0.6), Inches(1.5), Inches(5.8), Inches(5.5), RGBColor(0xEF,0xF6,0xFF))
    txt(s, "🎯 Problemática", Inches(0.9), Inches(1.7), Inches(5), Inches(0.5), 22, C_DARK)
    prob = [
        "• En San Luis Potosí, los usuarios de transporte urbano",
        "  carecen de un sistema digital accesible para consultar",
        "  rutas, horarios y disponibilidad de asientos en tiempo real.",
        "",
        "• La compra de boletos se realiza de forma presencial,",
        "  generando filas, pérdida de tiempo y una experiencia",
        "  de usuario deficiente.",
        "",
        "• No existe una plataforma unificada que permita a los",
        "  administradores gestionar rutas, usuarios y ventas de",
        "  manera centralizada y eficiente.",
    ]
    bullets(s, prob, Inches(0.9), Inches(2.4), Inches(5.2), Inches(4.5), 13, G_DK, 3)
    rrect(s, Inches(6.8), Inches(1.5), Inches(5.8), Inches(5.5), RGBColor(0xF0,0xFD,0xF4))
    txt(s, "✅ Solución: PremiumBus", Inches(7.1), Inches(1.7), Inches(5), Inches(0.5), 22, GREEN)
    sol = [
        "• Aplicación web progresiva (PWA) que permite a los",
        "  usuarios consultar las 30 rutas urbanas de SLP,",
        "  visualizar recorridos en mapa interactivo y comprar",
        "  boletos digitales desde cualquier dispositivo.",
        "",
        "• Panel administrativo completo con estadísticas de",
        "  ventas, gestión de usuarios y control de rutas.",
        "",
        "• Arquitectura dual: funciona con servidor MySQL",
        "  (producción) y en modo offline con localStorage",
        "  (demostración), garantizando disponibilidad total.",
    ]
    bullets(s, sol, Inches(7.1), Inches(2.4), Inches(5.2), Inches(4.5), 13, G_DK, 3)

# ── SLIDE 3: REQUISITOS ──
def slide3(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    header(s, "📑 Requisitos del Sistema")
    # Funcionales
    rrect(s, Inches(0.5), Inches(1.5), Inches(6), Inches(5.5), RGBColor(0xEF,0xF6,0xFF))
    txt(s, "⚙️ Requisitos Funcionales", Inches(0.8), Inches(1.65), Inches(5.5), Inches(0.4), 20, C_DARK)
    rf = [
        "RF1  Registro de usuario con nombre, correo y contraseña",
        "RF2  Inicio de sesión con validación de credenciales",
        "RF3  Verificación por código de 6 dígitos al registrarse",
        "RF4  Recuperación de contraseña en 3 pasos seguros",
        "RF5  Consulta de 30 rutas urbanas con mapa interactivo",
        "RF6  Compra de boletos con selección visual de asientos",
        "RF7  Historial de compras con estados activo/completado",
        "RF8  Panel admin: estadísticas, usuarios, rutas y ventas",
        "RF9  Login social (Google, Facebook, Instagram)",
        "RF10 Navegación SPA con protección de rutas (Guards)",
    ]
    bullets(s, rf, Inches(0.8), Inches(2.3), Inches(5.5), Inches(4.5), 12, G_DK, 4)
    # No funcionales
    rrect(s, Inches(6.8), Inches(1.5), Inches(6), Inches(5.5), RGBColor(0xFE,0xF3,0xC7))
    txt(s, "🛡️ Requisitos No Funcionales", Inches(7.1), Inches(1.65), Inches(5.5), Inches(0.4), 20, RGBColor(0xB4,0x5D,0x09))
    rnf = [
        "RNF1  Usabilidad: interfaz intuitiva, sin experiencia técnica",
        "RNF2  Rendimiento: respuesta < 3 segundos en toda acción",
        "RNF3  Seguridad: hash SHA-256, HTTPS, anti-inyección SQL",
        "RNF4  Disponibilidad: modo offline con localStorage",
        "RNF5  Compatibilidad: PWA en Android, iOS y PC (Chrome)",
        "RNF6  Mantenibilidad: código modular y documentado",
        "RNF7  Escalabilidad: arquitectura API REST desacoplada",
        "RNF8  Instalable: se puede agregar a pantalla de inicio",
    ]
    bullets(s, rnf, Inches(7.1), Inches(2.3), Inches(5.5), Inches(4.5), 12, G_DK, 4)

# ── SLIDE 4: HERRAMIENTAS ──
def slide4(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    header(s, "🛠️ Herramientas de Desarrollo")
    cats = [
        ("🌐 Frontend", [
            "HTML5 + CSS3 + JavaScript ES6+ (Vanilla)",
            "PWA: Service Worker + Web App Manifest",
            "Leaflet.js para mapas interactivos",
            "Sistema de diseño con tokens CSS personalizados",
        ], Inches(0.5), Inches(1.5), RGBColor(0xEF,0xF6,0xFF)),
        ("🖥️ Backend", [
            "PHP 7.4+ con API REST centralizada",
            "MySQL 8.0 con PDO y prepared statements",
            "XAMPP como servidor local de desarrollo",
            "SHA-256 para encriptación de contraseñas",
        ], Inches(6.8), Inches(1.5), RGBColor(0xF0,0xFD,0xF4)),
        ("📦 Herramientas", [
            "Visual Studio Code — Editor de código principal",
            "Git + GitHub — Control de versiones y repositorio",
            "Chrome DevTools — Depuración y testing",
            "Gemini AI — Asistente de desarrollo inteligente",
        ], Inches(0.5), Inches(4.4), RGBColor(0xFE,0xF3,0xC7)),
        ("📱 Despliegue", [
            "XAMPP para servidor local (Apache + MySQL)",
            "Instalador .HTA automatizado para el cliente",
            "PWA instalable en Android, iOS y escritorio",
            "Documentación completa en Word (.docx)",
        ], Inches(6.8), Inches(4.4), RGBColor(0xFD,0xF2,0xF8)),
    ]
    for title, items, l, t, color in cats:
        rrect(s, l, t, Inches(6), Inches(2.6), color)
        txt(s, title, Inches(l._inches+0.3), t+Inches(0.15), Inches(5), Inches(0.4), 20, C_DARK)
        bullets(s, ["• "+i for i in items], Inches(l._inches+0.3), t+Inches(0.65), Inches(5.2), Inches(1.8), 13, G_DK, 4)

# ── SLIDE 5: AUTENTICACIÓN Y MANTENIMIENTO ──
def slide5(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    header(s, "🔐 Autenticación, Mantenimiento y Código Fuente")
    # Crear cuenta
    rrect(s, Inches(0.4), Inches(1.4), Inches(4), Inches(2.7), RGBColor(0xEF,0xF6,0xFF))
    txt(s, "📝 Crear Cuenta", Inches(0.6), Inches(1.5), Inches(3.5), Inches(0.4), 18, C_DARK)
    c1 = [
        "1. Usuario ingresa nombre, correo y contraseña",
        "2. Sistema valida formato y unicidad de correo",
        "3. Se genera código de verificación de 6 dígitos",
        "4. Usuario ingresa el código recibido por email",
        "5. Si es válido, se crea la cuenta y auto-login",
    ]
    bullets(s, c1, Inches(0.6), Inches(2.1), Inches(3.5), Inches(1.8), 11, G_DK, 3)
    # Recuperar contraseña
    rrect(s, Inches(4.6), Inches(1.4), Inches(4), Inches(2.7), RGBColor(0xFE,0xF3,0xC7))
    txt(s, "🔑 Recuperar Contraseña", Inches(4.8), Inches(1.5), Inches(3.5), Inches(0.4), 18, RGBColor(0xB4,0x5D,0x09))
    c2 = [
        "1. Click en '¿Olvidaste tu contraseña?'",
        "2. Ingresa correo → sistema verifica existencia",
        "3. Se envía código de 6 dígitos al correo",
        "4. Usuario ingresa código de verificación",
        "5. Si es correcto, ingresa nueva contraseña",
        "6. Contraseña actualizada, puede iniciar sesión",
    ]
    bullets(s, c2, Inches(4.8), Inches(2.1), Inches(3.5), Inches(1.8), 11, G_DK, 3)
    # Modificar código
    rrect(s, Inches(8.8), Inches(1.4), Inches(4.2), Inches(2.7), RGBColor(0xF0,0xFD,0xF4))
    txt(s, "💻 Modificar el Código", Inches(9.0), Inches(1.5), Inches(3.8), Inches(0.4), 18, GREEN)
    c3 = [
        "• Frontend: carpeta src/ (pages/, components/)",
        "• Backend API: carpeta api/ (index.php, config.php)",
        "• Estilos: src/styles/ (tokens CSS y layouts)",
        "• BD: api/setup.sql o setup_db.php",
        "• Editar con VS Code u otro editor de texto",
    ]
    bullets(s, c3, Inches(9.0), Inches(2.1), Inches(3.8), Inches(1.8), 11, G_DK, 3)
    # GitHub
    rrect(s, Inches(0.4), Inches(4.3), Inches(12.6), Inches(2.8), RGBColor(0x1E,0x1E,0x2E))
    txt(s, "📦 Descargar el Proyecto desde GitHub", Inches(0.7), Inches(4.45), Inches(8), Inches(0.4), 20, WHITE)
    gh = [
        "🌐 Repositorio: https://github.com/[tu-usuario]/PremiumBus",
        "",
        "📥 Para descargar: ir al repositorio → botón verde 'Code' → 'Download ZIP'",
        "   O bien con Git:  git clone https://github.com/[tu-usuario]/PremiumBus.git",
        "",
        "📂 Estructura del proyecto:",
        "   PremiumBus/src/        → Código frontend (HTML, JS, CSS)",
        "   PremiumBus/api/        → Backend PHP + SQL de la base de datos",
        "   PremiumBus/setup_db.php → Configurador automático de MySQL",
        "   PremiumBus/index.html  → Punto de entrada de la aplicación",
    ]
    bullets(s, gh, Inches(0.7), Inches(5.0), Inches(12), Inches(2), 12, RGBColor(0xCE,0xD4,0xDA), 2)

# ── SLIDE 6: CUENTAS DE ADMINISTRADOR ──
def slide6(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    header(s, "👥 Cuentas de Administrador")
    txt(s, "El sistema cuenta con 10 cuentas de administrador predefinidas + 1 administrador principal.",
        Inches(0.8), Inches(1.4), Inches(11), Inches(0.5), 16, G_MD, False)
    # Principal
    rrect(s, Inches(0.5), Inches(2.0), Inches(5.5), Inches(1.8), RGBColor(0xFE,0xF3,0xC7))
    txt(s, "⭐ Administrador Principal (Super Admin)", Inches(0.8), Inches(2.1), Inches(5), Inches(0.4), 18, RGBColor(0xB4,0x5D,0x09))
    ap = [
        "📧 Correo: admin@premiumbus.com",
        "🔑 Contraseña: admin123",
        "🛡️ Permisos: TOTAL — puede eliminar usuarios, gestionar",
        "   todo el sistema y acceder a todas las funciones admin.",
    ]
    bullets(s, ap, Inches(0.8), Inches(2.65), Inches(5), Inches(1.2), 12, G_DK, 2)
    # Tabla 10 admins
    rrect(s, Inches(6.3), Inches(2.0), Inches(6.7), Inches(1.8), RGBColor(0xEF,0xF6,0xFF))
    txt(s, "ℹ️ Diferencia con los demás admins", Inches(6.5), Inches(2.1), Inches(6), Inches(0.4), 18, C_DARK)
    dif = [
        "• Solo el Admin Principal (ID: 1) puede eliminar usuarios",
        "• Los otros 9 admins pueden ver estadísticas, gestionar",
        "  rutas y compras, pero NO pueden eliminar cuentas.",
        "• Todos comparten la contraseña inicial: admin123",
    ]
    bullets(s, dif, Inches(6.5), Inches(2.65), Inches(6), Inches(1.2), 12, G_DK, 2)
    # Lista de admins
    rrect(s, Inches(0.5), Inches(4.0), Inches(12.5), Inches(3.1), G_LT)
    txt(s, "📋 Las 10 Cuentas de Administrador", Inches(0.8), Inches(4.1), Inches(10), Inches(0.4), 18, C_DARK)
    admins_left = [
        "1. Administrador Principal — admin@premiumbus.com",
        "2. Admin Operaciones — admin2@premiumbus.com",
        "3. Admin Finanzas — admin3@premiumbus.com",
        "4. Admin Soporte — admin4@premiumbus.com",
        "5. Admin Rutas — admin5@premiumbus.com",
    ]
    admins_right = [
        "6. Admin Recursos — admin6@premiumbus.com",
        "7. Admin Marketing — admin7@premiumbus.com",
        "8. Admin Seguridad — admin8@premiumbus.com",
        "9. Admin Calidad — admin9@premiumbus.com",
        "10. Admin Regional — admin10@premiumbus.com",
    ]
    bullets(s, admins_left, Inches(0.8), Inches(4.65), Inches(5.5), Inches(2.3), 13, G_DK, 5)
    bullets(s, admins_right, Inches(6.5), Inches(4.65), Inches(5.5), Inches(2.3), 13, G_DK, 5)
    txt(s, "🔑 Contraseña de todas las cuentas: admin123", Inches(3), Inches(6.85), Inches(7), Inches(0.3), 14, C_MED, True, PP_ALIGN.CENTER)

# ── SLIDE 7: DESPEDIDA ──
def slide7(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s, C_DARK)
    rect(s, Inches(0), Inches(0), SW, Inches(0.06), C_LT)
    rect(s, Inches(0), Inches(7.44), SW, Inches(0.06), C_LT)
    # Decorativos
    rrect(s, Inches(3.5), Inches(0.8), Inches(6.3), Inches(0.06), RGBColor(0x3B,0x82,0xF6))
    txt(s, "🚌", Inches(5), Inches(1.2), Inches(3), Inches(1.5), 80, WHITE, al=PP_ALIGN.CENTER)
    txt(s, "¡Gracias por su atención!", Inches(1.5), Inches(2.8), Inches(10), Inches(1), 44, WHITE, True, PP_ALIGN.CENTER)
    txt(s, "PremiumBus — Sistema de Gestión de Transporte Urbano",
        Inches(2), Inches(3.8), Inches(9), Inches(0.6), 20, RGBColor(0xA0,0xC4,0xED), False, PP_ALIGN.CENTER)
    rrect(s, Inches(5.5), Inches(4.6), Inches(2.3), Inches(0.04), C_LT)
    desp = [
        "📧 Contacto: [correo del equipo]",
        "🌐 GitHub: github.com/[tu-usuario]/PremiumBus",
        "📱 Sistema disponible como PWA instalable",
    ]
    bullets(s, desp, Inches(3.5), Inches(5.0), Inches(6.3), Inches(1.5), 16, RGBColor(0xB0,0xCC,0xE8), 8)
    txt(s, "Ingeniería de Software — Mayo 2026",
        Inches(2), Inches(6.8), Inches(9), Inches(0.4), 14, RGBColor(0x70,0x90,0xB0), False, PP_ALIGN.CENTER)

# ── MAIN ──
def main():
    prs = Presentation()
    prs.slide_width = SW; prs.slide_height = SH
    slide1(prs); slide2(prs); slide3(prs); slide4(prs)
    slide5(prs); slide6(prs); slide7(prs)
    prs.save(OUT)
    print(f"✅ Presentación generada: {OUT}")

if __name__ == "__main__":
    main()
