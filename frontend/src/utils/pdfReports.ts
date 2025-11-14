import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CategorySale {
  category_id: number;
  category_name: string;
  total_sales: number;
  total_orders: number;
  products_count: number;
}

interface CriticalProduct {
  product_id: number;
  product_name: string;
  seller_name: string;
  current_stock: number;
  min_stock_threshold: number;
  status: string;
}

interface InventoryReport {
  total_products: number;
  out_of_stock: number;
  low_stock: number;
  critical_products: CriticalProduct[];
}

/**
 * Genera un PDF con el reporte de ventas por categoría
 * y lo abre en una nueva pestaña del navegador
 */
export const generateSalesReportPDF = (
  categories: CategorySale[],
  startDate: string,
  endDate: string
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(139, 92, 246); // Purple
  doc.text('Reporte de Ventas por Categoría', 14, 20);
  
  // Subtitle
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Período: ${startDate} - ${endDate}`, 14, 28);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 14, 34);
  
  // Line separator
  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);
  
  // Summary Stats
  const totalSales = categories.reduce((sum, cat) => sum + cat.total_sales, 0);
  const totalOrders = categories.reduce((sum, cat) => sum + cat.total_orders, 0);
  const totalProducts = categories.reduce((sum, cat) => sum + cat.products_count, 0);
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('Resumen General:', 14, 46);
  
  doc.setFontSize(9);
  doc.text(`Total Ventas: $${totalSales.toFixed(2)}`, 14, 52);
  doc.text(`Total Órdenes: ${totalOrders}`, 14, 58);
  doc.text(`Productos Activos: ${totalProducts}`, 14, 64);
  doc.text(`Promedio por Orden: $${(totalSales / totalOrders || 0).toFixed(2)}`, 14, 70);
  
  // Table data
  const tableData = categories.map((cat, index) => [
    (index + 1).toString(),
    cat.category_name,
    `$${cat.total_sales.toFixed(2)}`,
    cat.total_orders.toString(),
    cat.products_count.toString(),
    `$${(cat.total_sales / cat.total_orders || 0).toFixed(2)}`,
  ]);
  
  // Generate table
  autoTable(doc, {
    startY: 78,
    head: [['#', 'Categoría', 'Ventas', 'Órdenes', 'Productos', 'Promedio/Orden']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [139, 92, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 243, 255],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 35, halign: 'right' },
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      'Marketplace Espigón Manta',
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }
  
  // Open PDF in new tab instead of downloading
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};

/**
 * Genera un PDF con el reporte de inventario
 * y lo abre en una nueva pestaña del navegador
 */
export const generateInventoryReportPDF = (
  inventoryReport: InventoryReport
) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(139, 92, 246);
  doc.text('Reporte de Inventario', 14, 20);
  
  // Subtitle
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 14, 28);
  
  // Line separator
  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);
  
  // Summary Stats
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('Resumen de Inventario:', 14, 40);
  
  // Summary boxes with colors
  const summaryY = 48;
  
  // Total Products (Green)
  doc.setFillColor(220, 252, 231);
  doc.rect(14, summaryY, 55, 20, 'F');
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(18);
  doc.text(inventoryReport.total_products.toString(), 41.5, summaryY + 10, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Total Productos', 41.5, summaryY + 16, { align: 'center' });
  
  // Out of Stock (Red)
  doc.setFillColor(254, 226, 226);
  doc.rect(77, summaryY, 55, 20, 'F');
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(18);
  doc.text(inventoryReport.out_of_stock.toString(), 104.5, summaryY + 10, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Sin Stock', 104.5, summaryY + 16, { align: 'center' });
  
  // Low Stock (Yellow)
  doc.setFillColor(254, 243, 199);
  doc.rect(140, summaryY, 55, 20, 'F');
  doc.setTextColor(234, 179, 8);
  doc.setFontSize(18);
  doc.text(inventoryReport.low_stock.toString(), 167.5, summaryY + 10, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Stock Bajo', 167.5, summaryY + 16, { align: 'center' });
  
  // Critical Products Section
  if (inventoryReport.critical_products.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38);
    doc.text('⚠ Productos Críticos', 14, 78);
    
    const tableData = inventoryReport.critical_products.map((product, index) => [
      (index + 1).toString(),
      product.product_name,
      product.seller_name,
      product.current_stock.toString(),
      product.min_stock_threshold.toString(),
      product.status === 'critical' ? 'CRÍTICO' : product.status === 'warning' ? 'ADVERTENCIA' : 'OK',
    ]);
    
    autoTable(doc, {
      startY: 82,
      head: [['#', 'Producto', 'Vendedor', 'Stock', 'Mínimo', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [254, 242, 242],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 45 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 30, halign: 'center' },
      },
      didDrawCell: (data) => {
        if (data.column.index === 5 && data.row.section === 'body') {
          const status = data.cell.text[0];
          if (status === 'CRÍTICO') {
            doc.setTextColor(220, 38, 38);
          } else if (status === 'ADVERTENCIA') {
            doc.setTextColor(234, 179, 8);
          }
        }
      },
    });
  } else {
    doc.setFontSize(11);
    doc.setTextColor(22, 163, 74);
    doc.text('✓ Excelente! No hay productos con stock crítico', 14, 78);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Todos los productos tienen inventario saludable', 14, 85);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      'Marketplace Espigón Manta',
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }
  
  // Open PDF in new tab instead of downloading
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};
