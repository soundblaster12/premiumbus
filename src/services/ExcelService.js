/**
 * ExcelService.js — Excel Export Wrapper
 * 
 * Wrapper agnóstico sobre SheetJS (xlsx) para generar
 * archivos .xlsx reales con múltiples hojas para auditorías.
 * 
 * Carga SheetJS dinámicamente desde CDN (lazy-load).
 */

let xlsxLibrary = null;

class ExcelServiceWrapper {
  /**
   * Carga la librería SheetJS desde CDN si no está disponible.
   * @returns {Promise<Object>} referencia a XLSX
   */
  async _loadSheetJS() {
    if (xlsxLibrary) return xlsxLibrary;

    // Si ya se cargó globalmente (por script tag)
    if (window.XLSX) {
      xlsxLibrary = window.XLSX;
      return xlsxLibrary;
    }

    // Carga dinámica desde CDN
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      script.onload = () => {
        xlsxLibrary = window.XLSX;
        resolve(xlsxLibrary);
      };
      script.onerror = () => reject(new Error('No se pudo cargar la librería de Excel.'));
      document.head.appendChild(script);
    });
  }

  /**
   * Genera y descarga un reporte de auditoría completo en formato .xlsx.
   * Incluye múltiples hojas con todos los datos del sistema.
   * 
   * @param {Object} data
   * @param {Array} data.purchases - Compras activas
   * @param {Array} data.history - Viajes completados
   * @param {Array} data.users - Todos los usuarios
   * @param {Array} data.trips - Todas las rutas
   * @param {Array} data.drivers - Todos los conductores
   * @returns {Promise<{success: boolean, error?: string, recordCount?: number}>}
   */
  async exportAuditReport(data) {
    try {
      const XLSX = await this._loadSheetJS();

      const workbook = XLSX.utils.book_new();

      // ── Hoja 1: Compras Activas ───────────────
      const purchaseRows = (data.purchases || []).map(p => ({
        'Folio': p.id || '',
        'Ruta': p.nombreRuta || p.nombre_ruta || '',
        'Origen': p.origen || '',
        'Destino': p.destino || '',
        'Asiento': p.asiento || '',
        'Precio (MXN)': p.precio?.toFixed(2) || '0.00',
        'Fecha Compra': this._formatDate(p.fechaCompra || p.fecha_compra),
        'Estado': p.status === 'active' ? 'En Curso' : (p.status || 'Desconocido'),
        'Usuario ID': p.usuarioId || '',
      }));
      const purchaseSheet = XLSX.utils.json_to_sheet(purchaseRows);
      this._autoFitColumns(purchaseSheet, purchaseRows);
      XLSX.utils.book_append_sheet(workbook, purchaseSheet, 'Compras Activas');

      // ── Hoja 2: Historial de Viajes ───────────
      const historyRows = (data.history || []).map(h => ({
        'Folio': h.id || '',
        'Ruta': h.nombreRuta || h.nombre_ruta || '',
        'Origen': h.origen || '',
        'Destino': h.destino || '',
        'Asiento': h.asiento || '',
        'Precio (MXN)': h.precio?.toFixed(2) || '0.00',
        'Fecha Compra': this._formatDate(h.fechaCompra || h.fecha_compra),
        'Fecha Finalización': this._formatDate(h.finishedAt),
        'Estado': 'Completado',
        'Usuario ID': h.usuarioId || '',
      }));
      const historySheet = XLSX.utils.json_to_sheet(historyRows);
      this._autoFitColumns(historySheet, historyRows);
      XLSX.utils.book_append_sheet(workbook, historySheet, 'Historial');

      // ── Hoja 3: Usuarios ──────────────────────
      const userRows = (data.users || []).map(u => ({
        'ID': u.id || '',
        'Nombre': u.nombre || '',
        'Correo': u.correo || '',
        'Rol': u.rol === 'admin' ? 'Administrador' : 'Usuario',
        'Proveedor Auth': u.authProvider || 'email',
        'Fecha Registro': this._formatDate(u.createdAt),
      }));
      const usersSheet = XLSX.utils.json_to_sheet(userRows);
      this._autoFitColumns(usersSheet, userRows);
      XLSX.utils.book_append_sheet(workbook, usersSheet, 'Usuarios');

      // ── Hoja 4: Rutas ─────────────────────────
      const tripRows = (data.trips || []).map(t => ({
        'ID': t.id || '',
        'Nombre Ruta': t.nombreRuta || t.nombre_ruta || '',
        'Origen': t.origen || '',
        'Destino': t.destino || '',
        'Precio (MXN)': t.precio?.toFixed(2) || '0.00',
        'Asientos Totales': t.asientosTotales || 40,
        'Asientos Ocupados': t.asientosOcupados?.length || 0,
        'Conductor': t.conductor || 'Sin asignar',
        'Descripción': t.descripcion || '',
        'Año Inicio': t.datosHistoricos?.anioInicio || '',
        'Kilómetros': t.datosHistoricos?.kilometros || '',
        'Tiempo Prom. (min)': t.datosHistoricos?.tiempoPromedioMin || '',
        'Pasajeros/Día': t.datosHistoricos?.pasajerosDiarios || '',
      }));
      const tripsSheet = XLSX.utils.json_to_sheet(tripRows);
      this._autoFitColumns(tripsSheet, tripRows);
      XLSX.utils.book_append_sheet(workbook, tripsSheet, 'Rutas');

      // ── Hoja 5: Conductores ───────────────────
      const driverRows = (data.drivers || []).map(d => ({
        'ID': d.id || '',
        'Nombre': d.nombre || '',
        'Teléfono': d.telefono || '',
        'Licencia': d.licencia || '',
        'Ruta Asignada': d.rutaAsignada || 'Sin asignar',
        'Estado': d.activo ? 'En Servicio' : 'Disponible',
        'Fecha Registro': this._formatDate(d.fechaRegistro),
      }));
      const driversSheet = XLSX.utils.json_to_sheet(driverRows);
      this._autoFitColumns(driversSheet, driverRows);
      XLSX.utils.book_append_sheet(workbook, driversSheet, 'Conductores');

      // ── Hoja 6: Resumen Ejecutivo ─────────────
      const allTransactions = [...(data.purchases || []), ...(data.history || [])];
      const totalRevenue = allTransactions.reduce((s, p) => s + (p.precio || 0), 0);
      const activeCount = (data.purchases || []).length;
      const completedCount = (data.history || []).length;
      const totalUsers = (data.users || []).filter(u => u.rol !== 'admin').length;
      const totalAdmins = (data.users || []).filter(u => u.rol === 'admin').length;

      const summaryData = [
        { 'Métrica': 'Fecha del Reporte', 'Valor': new Date().toLocaleString('es-MX') },
        { 'Métrica': 'Ingresos Totales (MXN)', 'Valor': `$${totalRevenue.toFixed(2)}` },
        { 'Métrica': 'Boletos Vendidos', 'Valor': allTransactions.length },
        { 'Métrica': 'Viajes Activos', 'Valor': activeCount },
        { 'Métrica': 'Viajes Completados', 'Valor': completedCount },
        { 'Métrica': 'Usuarios Registrados', 'Valor': totalUsers },
        { 'Métrica': 'Administradores', 'Valor': totalAdmins },
        { 'Métrica': 'Rutas en Operación', 'Valor': (data.trips || []).length },
        { 'Métrica': 'Conductores Registrados', 'Valor': (data.drivers || []).length },
        { 'Métrica': 'Precio Promedio Boleto', 'Valor': allTransactions.length > 0 ? `$${(totalRevenue / allTransactions.length).toFixed(2)}` : '$0.00' },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      this._autoFitColumns(summarySheet, summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen Ejecutivo');

      // ── Descargar archivo ─────────────────────
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `PremiumBus_Auditoria_${dateStr}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      const totalRecords = purchaseRows.length + historyRows.length + userRows.length + tripRows.length + driverRows.length;
      return { success: true, recordCount: totalRecords };

    } catch (error) {
      console.error('[ExcelService] Error:', error);
      return { success: false, error: error.message || 'Error al generar el archivo Excel.' };
    }
  }

  /**
   * Auto-ajusta el ancho de las columnas basándose en el contenido.
   * @param {Object} worksheet
   * @param {Array} data
   */
  _autoFitColumns(worksheet, data) {
    if (!data || data.length === 0) return;

    const headerKeys = Object.keys(data[0]);
    const columnWidths = headerKeys.map(key => {
      const maxDataLength = data.reduce((max, row) => {
        const cellValue = String(row[key] || '');
        return Math.max(max, cellValue.length);
      }, key.length);
      return { wch: Math.min(maxDataLength + 2, 40) };
    });

    worksheet['!cols'] = columnWidths;
  }

  /**
   * Formatea una fecha para el Excel.
   * @param {string} dateString
   * @returns {string}
   */
  _formatDate(dateString) {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateString);
    }
  }
}

export const ExcelService = new ExcelServiceWrapper();
