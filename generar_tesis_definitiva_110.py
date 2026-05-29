import os
import glob
from docx import Document
from docx.shared import Pt, Cm, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import PyPDF2

def create_element(name): return OxmlElement(name)
def create_attribute(element, name, value): element.set(qn(name), value)

def add_page_number(run):
    fldChar1 = create_element('w:fldChar')
    create_attribute(fldChar1, 'w:fldCharType', 'begin')
    instrText = create_element('w:instrText')
    create_attribute(instrText, 'xml:space', 'preserve')
    instrText.text = "PAGE"
    fldChar2 = create_element('w:fldChar')
    create_attribute(fldChar2, 'w:fldCharType', 'separate')
    fldChar3 = create_element('w:fldChar')
    create_attribute(fldChar3, 'w:fldCharType', 'end')
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)
    run._r.append(fldChar3)

doc = Document()
for section in doc.sections:
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.5)
    section.left_margin = Cm(3.0)
    section.right_margin = Cm(2.5)
    add_page_number(section.footer.paragraphs[0].add_run())
    section.footer.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

style = doc.styles['Normal']
style.font.name = 'Arial'
style.font.size = Pt(12)
style.paragraph_format.line_spacing = 1.5
style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
style.paragraph_format.first_line_indent = Cm(1.25)

def add_p(text, bold=False, center=False, level=None):
    if text.strip():
        if level:
            doc.add_heading(text, level=level)
            return None
        p = doc.add_paragraph()
        if center:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        if bold:
            p.add_run(text).bold = True
        else:
            p.add_run(text)
        return p

def extract_pdf_text(folder_path):
    text = ""
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.endswith('.pdf'):
                try:
                    with open(os.path.join(root, file), 'rb') as f:
                        reader = PyPDF2.PdfReader(f)
                        for page in reader.pages:
                            text += page.extract_text() + "\n"
                except Exception as e:
                    print(f"Error reading {file}: {e}")
    return text

# --- PORTADA OFICIAL TECNM ---
doc.add_paragraph('\n\n')
add_p('INSTITUTO TECNOLÓGICO', bold=True, center=True)
add_p('(TECNM)', bold=True, center=True)
doc.add_paragraph('\n')
add_p('TÍTULO DEL PROYECTO', bold=True, center=True)
add_p('Servicio on-line para gestión logística y boletaje a la industria', center=True)
add_p('en una Institución de Educación Superior (PremiumBus)', center=True)
doc.add_paragraph('\n')
add_p('Materia:', bold=True, center=True)
add_p('Ingeniería de Software', center=True)
doc.add_paragraph('\n')
add_p('Presentan:', bold=True, center=True)
add_p('David Coronado', center=True)
add_p('[Nombre del Integrante 2]', center=True)
add_p('[Nombre del Integrante 3]', center=True)
add_p('[Nombre del Integrante 4]', center=True)
doc.add_paragraph('\n\n\n\n')
add_p('Fecha: Mayo de 2026', center=True)
doc.add_page_break()

# --- RESUMEN (Igual que la Tesis de referencia) ---
add_p('RESUMEN', level=1)
add_p('En el presente trabajo se desarrolla e implementa un servicio on-line y móvil para gestión de logística y boletaje en una Institución de Educación Superior, mismo que tiene como propósito, dar a conocer al sector productivo la cartera de viajes disponibles así como facilitar los trámites de compra y gestión. La Especificación de Requisitos de Software (ERS) para el servicio se estructura basándose en los estándares ISO/IEC/IEEE 29148:2011 System and Software Engineering y el IEEE 830-1998.')
add_p('El análisis y el diseño del sistema incluye las actividades que contribuyen a transformar los requisitos identificados en implementación y código, para lo cual se utilizaron los siguientes artefactos: diagramas de casos de uso, diagrama de clases, modelo relacional y diccionario de datos. Finalmente se aplicaron diversas pruebas funcionales y de usabilidad.')
doc.add_page_break()

# --- CAPÍTULO 1. INTRODUCCIÓN Y ANTECEDENTES ---
add_p('CAPÍTULO 1. INTRODUCCIÓN AL SISTEMA PREMIUMBUS', level=1)
add_p('4.1 Propósito Extendido del Documento', level=2)
add_p('La documentación técnica representa el activo intangible más valioso de cualquier ciclo de vida de desarrollo de software (SDLC). El propósito central de este extenso documento trasciende la simple descripción de funcionalidades; está diseñado para mitigar la "Deuda Técnica" y erradicar el riesgo del "Factor de Autobús" (Bus Factor), es decir, el riesgo operativo que asume una organización cuando el conocimiento crítico del sistema reside exclusivamente en la memoria de los desarrolladores originales.')
add_p('Al compilar los esquemas de bases de datos, los diagramas de arquitectura, las decisiones de infraestructura y los flujos de código en un solo archivo maestro, este documento se convierte en la "Única Fuente de Verdad" (Single Source of Truth). Esto garantiza que:')
add_p('1. Los procesos de Onboarding (inducción) para nuevos ingenieros de software o administradores de sistemas se reduzcan de semanas a días.')
add_p('2. Las auditorías de seguridad informáticas tengan un mapa claro de los vectores de ataque posibles y las defensas implementadas.')
add_p('3. Las futuras expansiones del software (por ejemplo, escalar de un servidor local a clústeres en la nube AWS/Azure) tengan un plano arquitectónico claro sobre el cual cimentar las modificaciones sin romper la lógica existente.')

add_p('4.2 Alcance del Sistema (Scope) y Fronteras de Integración', level=2)
add_p('Definir el alcance de PremiumBus es vital para prevenir la "Corrupción del Alcance" (Scope Creep) durante su fase de mantenimiento. El sistema es una solución End-to-End autosuficiente que abarca:')
add_p('• Gestión de Inventario Dinámico: El sistema posee soberanía total sobre la creación, alteración, activación y cancelación de rutas geográficas, horarios de salida y mapeo de asientos físicos dentro de las unidades vehiculares.')
add_p('• Orquestación Comercial: Maneja el ciclo completo de vida del boleto, desde la intención de búsqueda del usuario, pasando por el bloqueo temporal por concurrencia, hasta la cristalización de la compra y emisión de un comprobante digital auditable.')

add_p('5. Descripción General y Filosofía Operativa del Sistema', level=2)
add_p('PremiumBus no es simplemente una herramienta de software; es un catalizador para un cambio de paradigma logístico. Históricamente, la terminal de autobuses ha operado bajo un modelo centralizado e ineficiente: los usuarios convergen físicamente en un punto geográfico, asumiendo costos de traslado, solo para competir en filas por un recurso finito (el asiento del autobús).')
add_p('Al migrar esta lógica hacia una arquitectura Cliente-Servidor en dispositivos móviles, PremiumBus descentraliza la taquilla. Ahora, cada dispositivo inteligente (Smartphone) que ejecuta la aplicación de PremiumBus se convierte en un punto de venta autónomo, conectado a la base de datos maestra a través de una API REST. Esta descentralización elimina asimetrías de información, pues el usuario conoce la oferta (asientos libres) en tiempo real, antes de salir de su hogar.')

# Incorporar texto de U1
add_p('6. Factibilidad y Planeación Inicial (Unidad 1)', level=2)
add_p('A continuación se documentan los análisis de factibilidad y recolección de requisitos (Entrevistas y Cartas Compromiso) desarrollados durante el inicio del proyecto.')
u1_text = extract_pdf_text('C:/Users/david/OneDrive/Documentos/PremiumBus/U1')
for line in u1_text.split('\n'):
    if len(line.strip()) > 30: add_p(line.strip())

doc.add_page_break()

# --- CAPÍTULO 2. ESPECIFICACIÓN DE REQUISITOS Y ANÁLISIS ---
add_p('CAPÍTULO 2. ESPECIFICACIÓN DE REQUISITOS Y ANÁLISIS', level=1)
add_p('La especificación de requisitos de software es una de las fases más importante en el proceso de desarrollo de software, ya que en esta se podrá obtener la descripción completa del comportamiento que tendrá el software que se va a desarrollar.')
add_p('En la siguiente tabla se describe el flujo de los casos de uso principales para la gestión del boletaje, adaptando estrictamente el formato descriptivo de la ERS (pág. 51).')

casos_uso = [
    "Registro de Usuario", "Login de Sistema", "Búsqueda de Viajes Activos", "Selección de Asiento", 
    "Bloqueo Temporal de Asiento", "Procesamiento de Pago", "Generación de Boleto QR", 
    "Cancelación de Compra", "Recuperación de Contraseña", "Edición de Perfil", 
    "Creación de Nueva Ruta", "Asignación de Vehículo", "Alta de Choferes", 
    "Reporte de Ventas Diarias", "Reporte de Ocupación por Viaje"
]

for idx, cu_nombre in enumerate(casos_uso, 1):
    add_p(f'Tabla {idx}. Descriptiva Caso de uso – {cu_nombre}', center=True)
    table = doc.add_table(rows=11, cols=2)
    table.style = 'Table Grid'
    table.cell(0,0).text = "Escenario:"
    table.cell(0,1).text = f"MÓDULO OPERATIVO {idx}"
    table.cell(1,0).text = "Caso de uso:"
    table.cell(1,1).text = cu_nombre
    table.cell(2,0).text = "Actor:"
    table.cell(2,1).text = "Administrador" if idx > 10 else "Usuario"
    table.cell(3,0).text = "Propósito:"
    table.cell(3,1).text = f"Ejecutar y validar lógicamente la acción de {cu_nombre.lower()} en el sistema."
    table.cell(4,0).text = "Resumen:"
    table.cell(4,1).text = f"El actor invoca la función {cu_nombre} y el sistema procesa los datos correspondientes en la BD."
    table.cell(5,0).text = "Tipo:"
    table.cell(5,1).text = "Primario."
    table.cell(6,0).merge(table.cell(6,1)).text = "Curso normal de eventos"
    table.cell(6,0).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    table.cell(7,0).text = "Acciones del actor"
    table.cell(7,1).text = "Respuesta del sistema"
    table.cell(8,0).text = "1.- Selecciona menú o botón correspondiente."
    table.cell(8,1).text = "2.- Despliega formulario o vista pertinente."
    table.cell(9,0).merge(table.cell(9,1)).text = "Cursos alternos"
    table.cell(9,0).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
    table.cell(10,0).merge(table.cell(10,1)).text = "Si los datos son inválidos, se retorna HTTP 400 Bad Request y se notifica al usuario."
    doc.add_paragraph('\n')

# Incorporar texto de U2
add_p('Análisis de Modelos y Diagramas de Secuencia (Unidad 2)', level=2)
add_p('En la siguiente sección se compila todo el texto descriptivo asociado a los diagramas de secuencia e interfaces extraídos de la Unidad 2.')
u2_text = extract_pdf_text('C:/Users/david/OneDrive/Documentos/PremiumBus/U2')
for line in u2_text.split('\n'):
    if len(line.strip()) > 30: add_p(line.strip())
doc.add_page_break()

# --- CAPÍTULO 3. DISEÑO E IMPLEMENTACIÓN ---
add_p('CAPÍTULO 3. DISEÑO E IMPLEMENTACIÓN', level=1)
add_p('El diseño es el primer paso en la fase de desarrollo de cualquier sistema, su objetivo radica en producir un modelo detallado de lo que se va a implementar posteriormente.')
add_p('A continuación, se detalla la Topología de la Arquitectura General (Three-Tier Client-Server):')
add_p('El sistema PremiumBus no es un software monolítico tradicional instalado en una sola computadora. Su estructura obedece al paradigma de Arquitectura de Tres Capas basada en el modelo Cliente-Servidor. El servidor web (Backend) actúa como un árbitro imparcial.')

add_p('3.1 Diseño de Interfaces y Modelos Visuales', level=2)
try:
    doc.add_picture('C:/Users/david/OneDrive/Documentos/PremiumBus/diseño.jpg', width=Inches(6.0))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_p('Figura 1. Modelo de Interfaz Visual. (FUENTE: Elaboración propia).', center=True)
except Exception:
    add_p('[ Imagen diseño.jpg no pudo ser cargada ]')

add_p('3.2 Diccionario de Datos', level=2)
add_p('A continuación se describen las tablas que integran el modelo relacional de PremiumBus, en la cual se muestran validaciones relacionadas con llaves primarias (PK), valores no nulos (NN), y generar automáticamente valores (UN/AI), basándose en el estándar de la página 101.')

tablas_db = [
    ('usuarios', [('id', 'INT', '✔', '✔', 'Clave de usuario'), ('nombre', 'VARCHAR(100)', '', '✔', 'Nombre completo'), ('correo', 'VARCHAR(150)', '', '✔', 'Login ID')]),
    ('viajes', [('id', 'INT', '✔', '✔', 'Clave de viaje'), ('ruta', 'VARCHAR(100)', '', '✔', 'Etiqueta ruta'), ('fecha', 'DATE', '', '✔', 'Fecha salida')]),
    ('compras', [('id', 'INT', '✔', '✔', 'Clave boleto'), ('id_viaje', 'INT', '', '✔', 'Llave Foránea'), ('asiento', 'INT', '', '✔', 'Número butaca')])
]

for i, (t_name, cols) in enumerate(tablas_db, 1):
    add_p(f'Tabla 30+{i}. Diccionario: {t_name}', center=True)
    t_dic = doc.add_table(rows=len(cols)+1, cols=5)
    t_dic.style = 'Table Grid'
    h = t_dic.rows[0].cells
    h[0].text, h[1].text, h[2].text, h[3].text, h[4].text = ('Campo', 'Tipo', 'PK', 'NN', 'Descripción')
    for r_idx, row_data in enumerate(cols, 1):
        for c_idx in range(5):
            t_dic.cell(r_idx, c_idx).text = row_data[c_idx]
    doc.add_paragraph('\n')

# Incorporar texto de U3
add_p('Lenguajes de Programación y Despliegue (Unidad 3)', level=2)
u3_text = extract_pdf_text('C:/Users/david/OneDrive/Documentos/PremiumBus/U3')
for line in u3_text.split('\n'):
    if len(line.strip()) > 30: add_p(line.strip())
doc.add_page_break()

# --- CÓDIGO FUENTE MASIVO ---
add_p('3.3 Implementación de Código Fuente (Microservicios)', level=2)
add_p('Se documentan a continuación todos los algoritmos producidos por el equipo para sustentar el desarrollo técnico.')

archivos_codigo = glob.glob('C:/Users/david/OneDrive/Documentos/PremiumBus/*.py') + \
                  glob.glob('C:/Users/david/OneDrive/Documentos/PremiumBus/*.php') + \
                  glob.glob('C:/Users/david/OneDrive/Documentos/PremiumBus/*.js')

for archivo in archivos_codigo:
    filename = os.path.basename(archivo)
    add_p(f'Código: {filename}', bold=True)
    try:
        with open(archivo, 'r', encoding='utf-8', errors='replace') as f:
            code_text = f.read()
            p_code = doc.add_paragraph()
            p_code.style.font.name = 'Courier New'
            p_code.style.font.size = Pt(8)
            p_code.add_run(code_text)
    except Exception as e:
        add_p(f"Error cargando {filename}")

doc.add_page_break()

# --- CAPÍTULO 4. PRUEBAS ---
add_p('CAPÍTULO 4. PRUEBAS Y VALIDACIÓN', level=1)
add_p('Todas las pruebas se basan en los requisitos especificados para el desarrollo de un software. Éstas se realizan mediante diversas técnicas cuya finalidad es validar que el software cumple con el nivel de calidad requerido por los usuarios.')
add_p('A continuación se documentan los planes de prueba y actas de aceptación compiladas a lo largo de la Unidad 4.')

u4_text = extract_pdf_text('C:/Users/david/OneDrive/Documentos/PremiumBus/U4')
for line in u4_text.split('\n'):
    if len(line.strip()) > 30: add_p(line.strip())

doc.add_page_break()

# --- ANEXOS Y MANUAL ---
add_p('ANEXOS', level=1)
add_p('Anexo A. Manual de Usuario Integrado', level=2)
add_p('El siguiente apartado fusiona íntegramente la documentación de la capacitación y uso del sistema.')
try:
    doc_manual = Document('C:/Users/david/OneDrive/Documentos/PremiumBus/Manual_Usuario_PremiumBus_v5.docx')
    for p in doc_manual.paragraphs:
        if p.text.strip():
            add_p(p.text)
except Exception as e:
    add_p(f"Error al cargar Manual Usuario: {str(e)}")

doc.save('C:/Users/david/OneDrive/Documentos/PremiumBus/Tesis_PremiumBus_TecNM_Final.docx')
print("Compilación definitiva generada exitosamente.")
