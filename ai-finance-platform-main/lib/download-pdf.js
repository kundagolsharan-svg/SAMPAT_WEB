import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const downloadMonthlyReport = (data) => {
  const { totalIncome, totalExpenses, categoryBreakdown, taxBreakdown, transactions, aiSummary, period } = data;
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(period.year, period.month - 1));
  const netSavings = totalIncome - totalExpenses;
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // --- Header Section (Dark Blue/Indigo Background) ---
  doc.setFillColor(30, 27, 75); // Deep Indigo
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text("SAMPAT AI", 14, 20);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(200, 200, 220);
  doc.text("Monthly Financial & Money Flow Report", 14, 28);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`${monthName} ${period.year}`, pageWidth - 14, 28, { align: "right" });

  let currentY = 50;

  // --- Executive Summary Boxes ---
  const boxWidth = (pageWidth - 36) / 3;
  
  // Income Box
  doc.setFillColor(240, 253, 244); // Light Green
  doc.setDrawColor(187, 247, 208); // Green Border
  doc.roundedRect(14, currentY, boxWidth, 25, 3, 3, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52); // Dark Green
  doc.text("Total Income", 14 + boxWidth/2, currentY + 8, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`INR ${totalIncome.toLocaleString('en-IN')}`, 14 + boxWidth/2, currentY + 18, { align: "center" });

  // Expenses Box
  doc.setFillColor(254, 242, 242); // Light Red
  doc.setDrawColor(254, 202, 202); // Red Border
  doc.roundedRect(14 + boxWidth + 4, currentY, boxWidth, 25, 3, 3, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(153, 27, 27); // Dark Red
  doc.setFont("helvetica", "normal");
  doc.text("Total Expenses", 14 + boxWidth + 4 + boxWidth/2, currentY + 8, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`INR ${totalExpenses.toLocaleString('en-IN')}`, 14 + boxWidth + 4 + boxWidth/2, currentY + 18, { align: "center" });

  // Net Savings Box
  doc.setFillColor(238, 242, 255); // Light Blue
  doc.setDrawColor(199, 210, 254); // Blue Border
  doc.roundedRect(14 + boxWidth * 2 + 8, currentY, boxWidth, 25, 3, 3, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(55, 48, 163); // Dark Blue
  doc.setFont("helvetica", "normal");
  doc.text("Net Savings", 14 + boxWidth * 2 + 8 + boxWidth/2, currentY + 8, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${netSavings >= 0 ? '+' : ''}INR ${netSavings.toLocaleString('en-IN')}`, 14 + boxWidth * 2 + 8 + boxWidth/2, currentY + 18, { align: "center" });

  currentY += 35;

  // --- AI Recommendations Section ---
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.roundedRect(14, currentY, pageWidth - 28, 10, 3, 3, 'FD'); // Just drawing the background height later
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138); // Blue 900
  doc.text("AI Money Flow Recommendations", 20, currentY + 10);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85); // Slate 700
  
  // Clean up AI text for PDF rendering
  const cleanSummary = aiSummary.replace(/\*\*/g, '').replace(/\*/g, '-');
  const splitSummary = doc.splitTextToSize(cleanSummary, pageWidth - 40);
  
  // Calculate dynamic height for the AI box
  const aiBoxHeight = (splitSummary.length * 5) + 20;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, aiBoxHeight, 3, 3, 'FD');
  
  // Redraw title inside box
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138);
  doc.text("SAMPAT AI Money Flow Insights", 20, currentY + 10);
  
  // Draw text
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(splitSummary, 20, currentY + 20);

  currentY += aiBoxHeight + 15;

  // --- Category Breakdown Table ---
  if (Object.keys(categoryBreakdown).length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Expense Breakdown by Category", 14, currentY);

    const categoryData = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .map(([cat, amt]) => [
        cat.charAt(0).toUpperCase() + cat.slice(1),
        `INR ${amt.toLocaleString('en-IN')}`
      ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["Category", "Amount Spent"]],
      body: categoryData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
    
    currentY = doc.lastAutoTable.finalY + 15;
  }

  // --- Transaction List Table ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Detailed Transaction History", 14, currentY);

  const tableData = transactions.map(t => [
    new Date(t.date).toLocaleDateString(),
    t.description.length > 30 ? t.description.substring(0, 30) + '...' : t.description,
    t.category,
    t.type === "INCOME" ? "+" : "-",
    `INR ${t.amount.toLocaleString('en-IN')}`
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Date", "Description", "Category", "Type", "Amount"]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      3: { halign: 'center', fontStyle: 'bold', textColor: [100, 100, 100] },
      4: { halign: 'right' }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw === '+') data.cell.styles.textColor = [22, 101, 52];
        else if (data.cell.raw === '-') data.cell.styles.textColor = [153, 27, 27];
      }
    },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9 }
  });

  // --- Footer ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`Generated by SAMPAT AI Financial Platform`, 14, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: "right" });
    
    // Add a subtle bottom line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
  }

  // Save the PDF
  doc.save(`SAMPAT_Money_Flow_Report_${monthName}_${period.year}.pdf`);
};
