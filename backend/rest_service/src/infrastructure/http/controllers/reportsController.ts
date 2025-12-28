import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import axios from "axios";

const GRAPHQL_SERVICE_URL = process.env.GRAPHQL_SERVICE_URL || "http://localhost:8000/graphql";

/**
 * Generate PDF report for category sales
 * @route GET /reports/category-sales/pdf?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
export const generateCategorySalesReportPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    if (!startDate || !endDate) {
      res.status(400).json({ error: "start_date and end_date are required" });
      return;
    }

    // Query para obtener ventas por categoría desde GraphQL service
    const graphqlQuery = `
      query CategorySalesReport($dateRange: DateRangeInput) {
        category_sales_report(date_range: $dateRange) {
          period_start
          period_end
          categories {
            category_id
            category_name
            total_sales
            total_orders
            products_count
          }
        }
      }
    `;

    const response = await axios.post(GRAPHQL_SERVICE_URL, {
      query: graphqlQuery,
      variables: {
        dateRange: {
          start_date: startDate,
          end_date: endDate
        }
      }
    });

    if (response.data.errors) {
      console.error("GraphQL errors:", response.data.errors);
      res.status(500).json({ error: "Error al obtener datos del servicio GraphQL" });
      return;
    }

    const categorySales = response.data.data.category_sales_report.categories;

    // Calcular totales
    const totalSales = categorySales.reduce((sum: number, cat: any) => sum + parseFloat(cat.total_sales || 0), 0);
    const totalOrders = categorySales.reduce((sum: number, cat: any) => sum + parseInt(cat.total_orders || 0), 0);
    const totalProducts = categorySales.reduce((sum: number, cat: any) => sum + parseInt(cat.products_count || 0), 0);

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="reporte-ventas-categorias-${startDate}-${endDate}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#8B5CF6').text('Reporte de Ventas por Categoría', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#666666').text(`Período: ${startDate} - ${endDate}`);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`);
    doc.moveDown();

    // Line separator
    doc.strokeColor('#8B5CF6').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Summary
    doc.fontSize(10).fillColor('#000000').text('Resumen General:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(9);
    doc.text(`Total Ventas: $${totalSales.toFixed(2)}`);
    doc.text(`Total Órdenes: ${totalOrders}`);
    doc.text(`Productos Activos: ${totalProducts}`);
    doc.text(`Promedio por Orden: $${(totalSales / totalOrders || 0).toFixed(2)}`);
    doc.moveDown(1.5);

    // Table Header
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 80;
    const col3 = 250;
    const col4 = 350;
    const col5 = 420;
    const col6 = 490;

    doc.fontSize(10).fillColor('#FFFFFF');
    doc.rect(col1, tableTop, 510, 20).fill('#8B5CF6');
    doc.text('#', col1 + 5, tableTop + 5, { width: 20 });
    doc.text('Categoría', col2 + 5, tableTop + 5, { width: 160 });
    doc.text('Ventas', col3 + 5, tableTop + 5, { width: 90 });
    doc.text('Órdenes', col4 + 5, tableTop + 5, { width: 60 });
    doc.text('Productos', col5 + 5, tableTop + 5, { width: 60 });

    // Table Rows
    let yPosition = tableTop + 25;
    doc.fontSize(9).fillColor('#000000');

    categorySales.forEach((category: any, index: number) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc.rect(col1, yPosition - 5, 510, 20).fill('#F5F3FF');
      }

      doc.fillColor('#000000');
      doc.text((index + 1).toString(), col1 + 5, yPosition, { width: 20 });
      doc.text(category.category_name, col2 + 5, yPosition, { width: 160 });
      doc.text(`$${parseFloat(category.total_sales).toFixed(2)}`, col3 + 5, yPosition, { width: 90 });
      doc.text(category.total_orders.toString(), col4 + 5, yPosition, { width: 60 });
      doc.text(category.products_count.toString(), col5 + 5, yPosition, { width: 60 });

      yPosition += 20;

      // Add new page if needed
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    });

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#999999');
      doc.text(
        `Página ${i + 1} de ${pages.count}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
      doc.text('Marketplace Espigón Manta', 50, doc.page.height - 50, { align: 'left' });
    }

    doc.end();
  } catch (error) {
    console.error("Error generating category sales PDF:", error);
    res.status(500).json({ error: "Error al generar reporte PDF" });
  }
};

/**
 * Generate PDF report for inventory
 * @route GET /reports/inventory/pdf?threshold=10
 */
export const generateInventoryReportPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const threshold = parseInt(req.query.threshold as string || "10");

    // Query para obtener inventario desde GraphQL service
    const graphqlQuery = `
      query InventoryReport($threshold: Int!) {
        inventory_report(min_stock_threshold: $threshold) {
          total_products
          out_of_stock
          low_stock
          critical_products {
            product_id
            product_name
            seller_name
            current_stock
            min_stock_threshold
            status
          }
        }
      }
    `;

    const response = await axios.post(GRAPHQL_SERVICE_URL, {
      query: graphqlQuery,
      variables: { threshold }
    });

    if (response.data.errors) {
      console.error("GraphQL errors:", response.data.errors);
      res.status(500).json({ error: "Error al obtener datos del servicio GraphQL" });
      return;
    }

    const inventoryReport = response.data.data.inventory_report;
    const stats = {
      total_products: inventoryReport.total_products,
      out_of_stock: inventoryReport.out_of_stock,
      low_stock: inventoryReport.low_stock
    };
    const criticalProducts = inventoryReport.critical_products;

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="reporte-inventario-${new Date().toISOString().split('T')[0]}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#8B5CF6').text('Reporte de Inventario', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#666666').text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`);
    doc.moveDown();

    // Line separator
    doc.strokeColor('#8B5CF6').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    // Summary boxes
    doc.fontSize(10).fillColor('#000000').text('Resumen de Inventario:', { underline: true });
    doc.moveDown();

    const boxY = doc.y;
    const boxWidth = 150;
    const boxHeight = 40;

    // Total Products (Green)
    doc.rect(50, boxY, boxWidth, boxHeight).fill('#DCFCE7');
    doc.fillColor('#16A34A').fontSize(24).text(stats.total_products.toString(), 50, boxY + 8, { width: boxWidth, align: 'center' });
    doc.fillColor('#666666').fontSize(9).text('Total Productos', 50, boxY + 28, { width: boxWidth, align: 'center' });

    // Out of Stock (Red)
    doc.rect(220, boxY, boxWidth, boxHeight).fill('#FEE2E2');
    doc.fillColor('#DC2626').fontSize(24).text(stats.out_of_stock.toString(), 220, boxY + 8, { width: boxWidth, align: 'center' });
    doc.fillColor('#666666').fontSize(9).text('Sin Stock', 220, boxY + 28, { width: boxWidth, align: 'center' });

    // Low Stock (Yellow)
    doc.rect(390, boxY, boxWidth, boxHeight).fill('#FEF3C7');
    doc.fillColor('#EA580C').fontSize(24).text(stats.low_stock.toString(), 390, boxY + 8, { width: boxWidth, align: 'center' });
    doc.fillColor('#666666').fontSize(9).text('Stock Bajo', 390, boxY + 28, { width: boxWidth, align: 'center' });

    doc.moveDown(4);

    // Critical Products Section
    if (criticalProducts.length > 0) {
      doc.fontSize(12).fillColor('#DC2626').text('⚠ Productos Críticos', { underline: true });
      doc.moveDown();

      // Table Header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 80;
      const col3 = 250;
      const col4 = 380;
      const col5 = 430;
      const col6 = 480;

      doc.fontSize(10).fillColor('#FFFFFF');
      doc.rect(col1, tableTop, 510, 20).fill('#DC2626');
      doc.text('#', col1 + 5, tableTop + 5, { width: 20 });
      doc.text('Producto', col2 + 5, tableTop + 5, { width: 160 });
      doc.text('Vendedor', col3 + 5, tableTop + 5, { width: 120 });
      doc.text('Stock', col4 + 5, tableTop + 5, { width: 40 });
      doc.text('Mínimo', col5 + 5, tableTop + 5, { width: 40 });
      doc.text('Estado', col6 + 5, tableTop + 5, { width: 60 });

      // Table Rows
      let yPosition = tableTop + 25;
      doc.fontSize(9);

      criticalProducts.forEach((product: any, index: number) => {
        if (index % 2 === 0) {
          doc.rect(col1, yPosition - 5, 510, 20).fill('#FEF2F2');
        }

        doc.fillColor('#000000');
        doc.text((index + 1).toString(), col1 + 5, yPosition, { width: 20 });
        doc.text(product.product_name.substring(0, 30), col2 + 5, yPosition, { width: 160 });
        doc.text(product.seller_name.substring(0, 20), col3 + 5, yPosition, { width: 120 });
        doc.text(product.current_stock.toString(), col4 + 5, yPosition, { width: 40 });
        doc.text(product.min_stock_threshold.toString(), col5 + 5, yPosition, { width: 40 });
        
        const statusColor = product.status === 'critical' ? '#DC2626' : '#EA580C';
        const statusText = product.status === 'critical' ? 'CRÍTICO' : 'AVISO';
        doc.fillColor(statusColor).text(statusText, col6 + 5, yPosition, { width: 60 });

        yPosition += 20;

        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      });
    } else {
      doc.fontSize(11).fillColor('#16A34A').text('✓ Excelente! No hay productos con stock crítico');
      doc.fontSize(9).fillColor('#666666').text('Todos los productos tienen inventario saludable');
    }

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#999999');
      doc.text(
        `Página ${i + 1} de ${pages.count}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
      doc.text('Marketplace Espigón Manta', 50, doc.page.height - 50, { align: 'left' });
    }

    doc.end();
  } catch (error) {
    console.error("Error generating inventory PDF:", error);
    res.status(500).json({ error: "Error al generar reporte PDF" });
  }
};

/**
 * Generate PDF report for top sellers
 * @route GET /api/reports/top-sellers/pdf?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&limit=10
 */
export const generateTopSellersReportPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const limit = parseInt(req.query.limit as string || "10");

    if (!startDate || !endDate) {
      res.status(400).json({ error: "start_date and end_date are required" });
      return;
    }

    // Query para obtener top vendedores desde GraphQL service
    const graphqlQuery = `
      query TopSellersReport($dateRange: DateRangeInput, $limit: Int) {
        top_sellers_report(date_range: $dateRange, limit: $limit) {
          period_start
          period_end
          top_sellers {
            seller_id
            seller_name
            business_name
            total_sales
            total_orders
            products_sold
          }
        }
      }
    `;

    const response = await axios.post(GRAPHQL_SERVICE_URL, {
      query: graphqlQuery,
      variables: {
        dateRange: { start_date: startDate, end_date: endDate },
        limit
      }
    });

    if (response.data.errors) {
      console.error("GraphQL errors:", response.data.errors);
      res.status(500).json({ error: "Error al obtener datos del servicio GraphQL" });
      return;
    }

    const topSellers = response.data.data.top_sellers_report.top_sellers;

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="reporte-top-vendedores-${startDate}-${endDate}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#8B5CF6').text('Top Vendedores', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#666666').text(`Período: ${startDate} - ${endDate}`);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`);
    doc.moveDown();

    doc.strokeColor('#8B5CF6').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    if (topSellers.length === 0) {
      doc.fontSize(11).fillColor('#666666').text('No hay datos de ventas en el período seleccionado');
    } else {
      // Table Header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 80;
      const col3 = 250;
      const col4 = 350;
      const col5 = 420;
      const col6 = 490;

      doc.fontSize(10).fillColor('#FFFFFF');
      doc.rect(col1, tableTop, 510, 20).fill('#8B5CF6');
      doc.text('#', col1 + 5, tableTop + 5, { width: 20 });
      doc.text('Vendedor', col2 + 5, tableTop + 5, { width: 160 });
      doc.text('Ventas', col3 + 5, tableTop + 5, { width: 90 });
      doc.text('Órdenes', col4 + 5, tableTop + 5, { width: 60 });
      doc.text('Unidades', col6 + 5, tableTop + 5, { width: 60 });

      let yPosition = tableTop + 25;
      doc.fontSize(9).fillColor('#000000');

      topSellers.forEach((seller: any, index: number) => {
        if (index % 2 === 0) {
          doc.rect(col1, yPosition - 5, 510, 20).fill('#F5F3FF');
        }

        doc.fillColor('#000000');
        doc.text((index + 1).toString(), col1 + 5, yPosition, { width: 20 });
        doc.text(seller.seller_name.substring(0, 30), col2 + 5, yPosition, { width: 160 });
        doc.text(`$${parseFloat(seller.total_sales).toFixed(2)}`, col3 + 5, yPosition, { width: 90 });
        doc.text(seller.total_orders.toString(), col4 + 5, yPosition, { width: 60 });
        doc.text(seller.products_sold.toString(), col6 + 5, yPosition, { width: 60 });

        yPosition += 20;

        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      });
    }

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#999999');
      doc.text(`Página ${i + 1} de ${pages.count}`, 50, doc.page.height - 50, { align: 'center' });
      doc.text('Marketplace Espigón Manta', 50, doc.page.height - 50, { align: 'left' });
    }

    doc.end();
  } catch (error) {
    console.error("Error generating top sellers PDF:", error);
    res.status(500).json({ error: "Error al generar reporte PDF" });
  }
};

/**
 * Generate PDF report for best products
 * @route GET /api/reports/best-products/pdf?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&limit=10
 */
export const generateBestProductsReportPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const limit = parseInt(req.query.limit as string || "10");

    if (!startDate || !endDate) {
      res.status(400).json({ error: "start_date and end_date are required" });
      return;
    }

    // Query para obtener mejores productos desde GraphQL service
    const graphqlQuery = `
      query BestProductsReport($dateRange: DateRangeInput, $limit: Int) {
        best_products_report(date_range: $dateRange, limit: $limit) {
          period_start
          period_end
          best_products {
            product_id
            product_name
            category_name
            units_sold
            total_revenue
            average_price
          }
        }
      }
    `;

    const response = await axios.post(GRAPHQL_SERVICE_URL, {
      query: graphqlQuery,
      variables: {
        dateRange: { start_date: startDate, end_date: endDate },
        limit
      }
    });

    if (response.data.errors) {
      console.error("GraphQL errors:", response.data.errors);
      res.status(500).json({ error: "Error al obtener datos del servicio GraphQL" });
      return;
    }

    const bestProducts = response.data.data.best_products_report.best_products;

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="reporte-mejores-productos-${startDate}-${endDate}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#8B5CF6').text('Mejores Productos', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#666666').text(`Período: ${startDate} - ${endDate}`);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`);
    doc.moveDown();

    doc.strokeColor('#8B5CF6').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    if (bestProducts.length === 0) {
      doc.fontSize(11).fillColor('#666666').text('No hay datos de productos vendidos en el período seleccionado');
    } else {
      // Table Header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 80;
      const col3 = 240;
      const col4 = 320;
      const col5 = 400;
      const col6 = 480;

      doc.fontSize(10).fillColor('#FFFFFF');
      doc.rect(col1, tableTop, 510, 20).fill('#8B5CF6');
      doc.text('#', col1 + 5, tableTop + 5, { width: 20 });
      doc.text('Producto', col2 + 5, tableTop + 5, { width: 150 });
      doc.text('Categoría', col3 + 5, tableTop + 5, { width: 70 });
      doc.text('Unidades', col4 + 5, tableTop + 5, { width: 70 });
      doc.text('Ingresos', col5 + 5, tableTop + 5, { width: 70 });

      let yPosition = tableTop + 25;
      doc.fontSize(9).fillColor('#000000');

      bestProducts.forEach((product: any, index: number) => {
        if (index % 2 === 0) {
          doc.rect(col1, yPosition - 5, 510, 20).fill('#F5F3FF');
        }

        doc.fillColor('#000000');
        doc.text((index + 1).toString(), col1 + 5, yPosition, { width: 20 });
        doc.text(product.product_name.substring(0, 25), col2 + 5, yPosition, { width: 150 });
        doc.text(product.category_name.substring(0, 12), col3 + 5, yPosition, { width: 70 });
        doc.text(product.units_sold.toString(), col4 + 5, yPosition, { width: 70 });
        doc.text(`$${parseFloat(product.total_revenue).toFixed(2)}`, col5 + 5, yPosition, { width: 70 });

        yPosition += 20;

        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      });
    }

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#999999');
      doc.text(`Página ${i + 1} de ${pages.count}`, 50, doc.page.height - 50, { align: 'center' });
      doc.text('Marketplace Espigón Manta', 50, doc.page.height - 50, { align: 'left' });
    }

    doc.end();
  } catch (error) {
    console.error("Error generating best products PDF:", error);
    res.status(500).json({ error: "Error al generar reporte PDF" });
  }
};

/**
 * Generate PDF report for delivery performance
 * @route GET /api/reports/delivery-performance/pdf?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
export const generateDeliveryPerformanceReportPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    if (!startDate || !endDate) {
      res.status(400).json({ error: "start_date and end_date are required" });
      return;
    }

    // Query para obtener rendimiento de entregas desde GraphQL service
    const graphqlQuery = `
      query DeliveryPerformanceReport($dateRange: DateRangeInput) {
        delivery_performance_report(date_range: $dateRange) {
          period_start
          period_end
          total_deliveries
          completed
          pending
          cancelled
          average_delivery_time_hours
          status_breakdown {
            status
            count
            percentage
          }
        }
      }
    `;

    const response = await axios.post(GRAPHQL_SERVICE_URL, {
      query: graphqlQuery,
      variables: {
        dateRange: { start_date: startDate, end_date: endDate }
      }
    });

    if (response.data.errors) {
      console.error("GraphQL errors:", response.data.errors);
      res.status(500).json({ error: "Error al obtener datos del servicio GraphQL" });
      return;
    }

    const deliveryReport = response.data.data.delivery_performance_report;
    const stats = {
      total_deliveries: deliveryReport.total_deliveries,
      completed: deliveryReport.completed,
      pending: deliveryReport.pending,
      cancelled: deliveryReport.cancelled
    };
    const statusBreakdown = deliveryReport.status_breakdown;

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="reporte-entregas-${startDate}-${endDate}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#8B5CF6').text('Rendimiento de Entregas', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#666666').text(`Período: ${startDate} - ${endDate}`);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`);
    doc.moveDown();

    doc.strokeColor('#8B5CF6').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    // Summary boxes
    doc.fontSize(10).fillColor('#000000').text('Resumen de Entregas:', { underline: true });
    doc.moveDown();

    const boxY = doc.y;
    const boxWidth = 120;
    const boxHeight = 40;

    // Total Deliveries
    doc.rect(50, boxY, boxWidth, boxHeight).fill('#DCFCE7');
    doc.fillColor('#16A34A').fontSize(20).text(stats.total_deliveries.toString(), 50, boxY + 8, { width: boxWidth, align: 'center' });
    doc.fillColor('#666666').fontSize(9).text('Total Entregas', 50, boxY + 28, { width: boxWidth, align: 'center' });

    // Completed
    doc.rect(190, boxY, boxWidth, boxHeight).fill('#DBEAFE');
    doc.fillColor('#3B82F6').fontSize(20).text(stats.completed.toString(), 190, boxY + 8, { width: boxWidth, align: 'center' });
    doc.fillColor('#666666').fontSize(9).text('Completadas', 190, boxY + 28, { width: boxWidth, align: 'center' });

    // Pending
    doc.rect(330, boxY, boxWidth, boxHeight).fill('#FEF3C7');
    doc.fillColor('#EA580C').fontSize(20).text(stats.pending.toString(), 330, boxY + 8, { width: boxWidth, align: 'center' });
    doc.fillColor('#666666').fontSize(9).text('Pendientes', 330, boxY + 28, { width: boxWidth, align: 'center' });

    doc.moveDown(4);

    // Status breakdown table
    if (statusBreakdown.length > 0) {
      doc.fontSize(12).fillColor('#000000').text('Desglose por Estado', { underline: true });
      doc.moveDown();

      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 200;
      const col3 = 350;

      doc.fontSize(10).fillColor('#FFFFFF');
      doc.rect(col1, tableTop, 460, 20).fill('#8B5CF6');
      doc.text('Estado', col1 + 5, tableTop + 5, { width: 140 });
      doc.text('Cantidad', col2 + 5, tableTop + 5, { width: 140 });
      doc.text('Porcentaje', col3 + 5, tableTop + 5, { width: 140 });

      let yPosition = tableTop + 25;
      doc.fontSize(9).fillColor('#000000');

      statusBreakdown.forEach((status: any, index: number) => {
        if (index % 2 === 0) {
          doc.rect(col1, yPosition - 5, 460, 20).fill('#F5F3FF');
        }

        doc.fillColor('#000000');
        doc.text(status.status, col1 + 5, yPosition, { width: 140 });
        doc.text(status.count.toString(), col2 + 5, yPosition, { width: 140 });
        doc.text(`${status.percentage}%`, col3 + 5, yPosition, { width: 140 });

        yPosition += 20;
      });
    }

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#999999');
      doc.text(`Página ${i + 1} de ${pages.count}`, 50, doc.page.height - 50, { align: 'center' });
      doc.text('Marketplace Espigón Manta', 50, doc.page.height - 50, { align: 'left' });
    }

    doc.end();
  } catch (error) {
    console.error("Error generating delivery performance PDF:", error);
    res.status(500).json({ error: "Error al generar reporte PDF" });
  }
};
