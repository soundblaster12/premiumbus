import os
from docx import Document
from docx.shared import Pt, Cm, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

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

def add_p(text, bold=False, center=False):
    if text.strip():
        p = doc.add_paragraph()
        if center:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        if bold:
            p.add_run(text).bold = True
        else:
            p.add_run(text)
        return p

# --- PORTADA OFICIAL TECNM ---
doc.add_paragraph('\n\n')
add_p('INSTITUTO TECNOLÓGICO', bold=True, center=True)
add_p('(TECNM)', bold=True, center=True)
doc.add_paragraph('\n')
add_p('TÍTULO DEL PROYECTO', bold=True, center=True)
add_p('Sistema on-line y móvil para gestión logística y boletaje de transporte terrestre', center=True)
add_p('(PremiumBus)', bold=True, center=True)
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

# --- RESUMEN ---
doc.add_heading('RESUMEN', level=1)
add_p('En el presente trabajo se desarrolla e implementa un servicio on-line y móvil para la gestión de boletaje de transporte a la industria, mismo que tiene como propósito, dar a conocer al sector productivo la cartera de rutas disponibles así como facilitar los trámites de compra y logística. La Especificación de Requisitos de Software (ERS) para el servicio se estructura basándose en los estándares ISO/IEC/IEEE 29148:2011 y el IEEE 830-1998. El análisis y el diseño del sistema incluye las actividades que contribuyen a transformar los requisitos identificados en implementación y código, para lo cual se utilizaron los siguientes artefactos: diagramas de casos de uso, modelo relacional y diccionario de datos.')

# --- CAPÍTULO 1 ---
doc.add_page_break()
doc.add_heading('CAPÍTULO 1. ANTECEDENTES', level=1)
doc.add_heading('1.1 IDENTIFICACIÓN DEL PROBLEMA', level=2)
add_p('La vinculación entre la tecnología y el sector del transporte tiene un potencial de crecimiento inmenso, dado que las empresas de transporte tienen necesidades específicas de digitalización, las cuales buscan ser atendidas para modernizar la gestión de boletaje. En este sentido no existe un procedimiento específico y adecuado para el diseño e impartición de ventas automatizadas que incluya un control de inventario concurrente, que permita establecer una certidumbre con los usuarios.')

doc.add_heading('1.2 OBJETIVO', level=2)
add_p('Crear un servicio on-line y móvil que implemente la gestión de compra de boletos al sector transporte en una Institución, que permita identificar la demanda de asientos, dar a conocer la cartera de viajes disponibles y facilitar los trámites de gestión para su compra.')

# --- CAPÍTULO 2 ---
doc.add_page_break()
doc.add_heading('CAPÍTULO 2. ESPECIFICACIÓN DE REQUISITOS Y ANÁLISIS', level=1)
add_p('En este apartado se detalla la Especificación de Requisitos de Software (ERS) para el Servicio PremiumBus, el cual está basado en los estándares ISO/IEC/IEEE 29148:2011.')

doc.add_heading('2.1 ANÁLISIS DEL SISTEMA', level=2)
add_p('El análisis del sistema incluye todas las actividades que contribuyen a transformar los requisitos identificados en implementación, es la fase intermedia que ayuda a los requisitos funcionales a ser transformados en código. En este caso se presentan los siguientes artefactos: diagramas de casos de uso relacionados con la administración de viajes y compras.')

doc.add_heading('2.1.1 Casos de Uso del Sistema', level=3)
add_p('En la siguiente tabla se describe el flujo de los casos de uso principales para la gestión del boletaje, adaptando el formato descriptivo de la ERS.')

# Tabla de Caso de Uso 1 (Estilo pág 51/63)
add_p('Tabla 1. Descriptiva Caso de uso – Procesar Compra.', center=True)
table_cu1 = doc.add_table(rows=12, cols=2)
table_cu1.style = 'Table Grid'
table_cu1.cell(0,0).text = "Escenario:"
table_cu1.cell(0,1).text = "TRANSACCIONALIDAD COMERCIAL"
table_cu1.cell(1,0).text = "Caso de uso:"
table_cu1.cell(1,1).text = "Procesar compra de asiento."
table_cu1.cell(2,0).text = "Actor:"
table_cu1.cell(2,1).text = "Usuario (Cliente)."
table_cu1.cell(3,0).text = "Propósito:"
table_cu1.cell(3,1).text = "Almacenar en la base de datos la reserva de un asiento específico en un viaje."
table_cu1.cell(4,0).text = "Resumen:"
table_cu1.cell(4,1).text = "El usuario ingresa la información de pago y el sistema bloquea el asiento para evitar sobreventa."
table_cu1.cell(5,0).text = "Tipo:"
table_cu1.cell(5,1).text = "Primario."
table_cu1.cell(6,0).merge(table_cu1.cell(6,1)).text = "Curso normal de eventos"
table_cu1.cell(6,0).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
table_cu1.cell(7,0).text = "Acciones del actor"
table_cu1.cell(7,1).text = "Respuesta del sistema"
table_cu1.cell(8,0).text = "1.- Selecciona el viaje deseado y el asiento libre."
table_cu1.cell(8,1).text = "2.- Muestra el resumen de la compra y formulario de confirmación."
table_cu1.cell(9,0).text = "3.- Da clic en el botón Pagar."
table_cu1.cell(9,1).text = "4.- Genera inserción en MySQL. 5.- Emite boleto digital."
table_cu1.cell(10,0).merge(table_cu1.cell(10,1)).text = "Cursos alternos"
table_cu1.cell(10,0).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
table_cu1.cell(11,0).merge(table_cu1.cell(11,1)).text = "4b.- Muestra mensaje de error 'Asiento Ocupado' si hay concurrencia. Regresa al paso 1."

doc.add_paragraph('\n')

add_p('Tabla 2. Descriptiva Caso de uso – Administración de Rutas.', center=True)
table_cu2 = doc.add_table(rows=12, cols=2)
table_cu2.style = 'Table Grid'
table_cu2.cell(0,0).text = "Escenario:"
table_cu2.cell(0,1).text = "ADMINISTRACIÓN LOGÍSTICA"
table_cu2.cell(1,0).text = "Caso de uso:"
table_cu2.cell(1,1).text = "Dar de alta nueva ruta de transporte."
table_cu2.cell(2,0).text = "Actor:"
table_cu2.cell(2,1).text = "Administrador."
table_cu2.cell(3,0).text = "Propósito:"
table_cu2.cell(3,1).text = "Almacenar en la BD un nuevo trayecto georreferenciado."
table_cu2.cell(4,0).text = "Resumen:"
table_cu2.cell(4,1).text = "El administrador configura el origen, destino y coordenadas GPS de la ruta."
table_cu2.cell(5,0).text = "Tipo:"
table_cu2.cell(5,1).text = "Primario."
table_cu2.cell(6,0).merge(table_cu2.cell(6,1)).text = "Curso normal de eventos"
table_cu2.cell(6,0).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
table_cu2.cell(7,0).text = "Acciones del actor"
table_cu2.cell(7,1).text = "Respuesta del sistema"
table_cu2.cell(8,0).text = "1.- Selecciona menú 'Nueva Ruta'."
table_cu2.cell(8,1).text = "2.- Muestra formulario con mapa interactivo."
table_cu2.cell(9,0).text = "3.- Ingresa coordenadas y da clic en 'Guardar'."
table_cu2.cell(9,1).text = "4.- Guarda la nueva fila en la tabla 'viajes'."
table_cu2.cell(10,0).merge(table_cu2.cell(10,1)).text = "Cursos alternos"
table_cu2.cell(10,0).paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
table_cu2.cell(11,0).merge(table_cu2.cell(11,1)).text = "3b.- Error de validación si faltan coordenadas. Regresa a paso 2."

# --- CAPÍTULO 3 ---
doc.add_page_break()
doc.add_heading('CAPÍTULO 3. DISEÑO E IMPLEMENTACIÓN', level=1)
add_p('El diseño es el primer paso en la fase de desarrollo de cualquier sistema, su objetivo radica en producir un modelo detallado de lo que se va a implementar posteriormente.')

doc.add_heading('3.1 Diseño de Interfaces de Usuario', level=2)
add_p('A continuación se muestra el prototipo y flujo visual de PremiumBus. Este modelo ilustra la navegabilidad de la aplicación Android.')
try:
    doc.add_picture('C:/Users/david/OneDrive/Documentos/PremiumBus/diseño.jpg', width=Inches(5.5))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_p('Figura 1. Modelo de Interfaz Visual. (FUENTE: Elaboración propia).', center=True)
except Exception:
    add_p('[ Imagen diseño.jpg no pudo ser cargada ]')

doc.add_heading('3.2 Diccionario de Datos', level=2)
add_p('A continuación se describen las tablas que integran el modelo relacional de PremiumBus, en la cual se muestran validaciones relacionadas con llaves primarias (PK), valores no nulos (NN), y generar automáticamente valores (UN/AI), basándose en la estructura formal del proyecto.')

# Tablas tipo Pág. 101/118
add_p('Tabla 3. Diccionario: usuarios', center=True)
t_dic1 = doc.add_table(rows=6, cols=5)
t_dic1.style = 'Table Grid'
h1 = t_dic1.rows[0].cells
h1[0].text, h1[1].text, h1[2].text, h1[3].text, h1[4].text = ('Campo', 'Tipo', 'PK', 'NN', 'Descripción')
data1 = [
    ('id', 'INT', '✔', '✔', 'Clave que identifica a cada usuario del sistema.'),
    ('nombre', 'VARCHAR(100)', '', '✔', 'Nombre y apellidos del pasajero.'),
    ('correo', 'VARCHAR(150)', '', '✔', 'Identificador de inicio de sesión único.'),
    ('password', 'VARCHAR(255)', '', '✔', 'Hash criptográfico bcrypt.'),
    ('rol', 'VARCHAR(50)', '', '✔', 'Nivel de privilegios (user/admin).')
]
for i, row in enumerate(data1, 1):
    for j in range(5):
        t_dic1.cell(i, j).text = row[j]

doc.add_paragraph('\n')
add_p('Tabla 4. Diccionario: viajes', center=True)
t_dic2 = doc.add_table(rows=6, cols=5)
t_dic2.style = 'Table Grid'
h2 = t_dic2.rows[0].cells
h2[0].text, h2[1].text, h2[2].text, h2[3].text, h2[4].text = ('Campo', 'Tipo', 'PK', 'NN', 'Descripción')
data2 = [
    ('id', 'INT', '✔', '✔', 'Clave que identifica la corrida logística.'),
    ('nombre_ruta', 'VARCHAR(100)', '', '✔', 'Etiqueta de la ruta (Ej. Saucito-Centro).'),
    ('origen_lat', 'DECIMAL(10,7)', '', '✔', 'Coordenada exacta de salida.'),
    ('destino_lat', 'DECIMAL(10,7)', '', '✔', 'Coordenada exacta de llegada.'),
    ('asientos_totales', 'INT', '', '✔', 'Capacidad límite del vehículo.')
]
for i, row in enumerate(data2, 1):
    for j in range(5):
        t_dic2.cell(i, j).text = row[j]

doc.add_paragraph('\n')
add_p('Tabla 5. Diccionario: compras (Transaccional)', center=True)
t_dic3 = doc.add_table(rows=6, cols=5)
t_dic3.style = 'Table Grid'
h3 = t_dic3.rows[0].cells
h3[0].text, h3[1].text, h3[2].text, h3[3].text, h3[4].text = ('Campo', 'Tipo', 'PK', 'NN', 'Descripción')
data3 = [
    ('id', 'INT', '✔', '✔', 'Folio digital del boleto.'),
    ('usuario_id', 'INT', '', '✔', 'FK del cliente que realiza la compra.'),
    ('viaje_id', 'INT', '', '✔', 'FK del viaje solicitado.'),
    ('asiento', 'INT', '', '✔', 'Número físico de butaca. Posee UNIQUE restriction.'),
    ('created_at', 'TIMESTAMP', '', '✔', 'Fecha de la transacción.')
]
for i, row in enumerate(data3, 1):
    for j in range(5):
        t_dic3.cell(i, j).text = row[j]

# --- CONCLUSIONES ---
doc.add_page_break()
doc.add_heading('CONCLUSIONES', level=1)
add_p('Hoy en día la vinculación entre los sistemas móviles y el transporte terrestre es muy importante, ya que a través de ésta se facilita los procesos de gestión logística, los cuales permiten vincular a los pasajeros con el sector productivo en tiempo real.')
add_p('El método utilizado para PremiumBus se basa en la Especificación de Requisitos de Software, que incluye cuatro áreas principales: elicitación, análisis, especificación y validación. La arquitectura de base de datos asegura la integridad de la transaccionalidad mediante bloqueos a nivel de fila y restricciones lógicas formales.')

doc.save('C:/Users/david/OneDrive/Documentos/PremiumBus/Documento_PremiumBus_TecNM.docx')
print("Documento TecNM generado exitosamente.")
