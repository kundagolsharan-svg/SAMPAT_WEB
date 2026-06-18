import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const downloadMonthlyReport = (data) => {
  const { totalIncome, totalExpenses, categoryBreakdown, taxBreakdown, transactions, aiSummary, period } = data;
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(period.year, period.month - 1));
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Title
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text("SAMPAT Financial Report", 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`${monthName} ${period.year}`, 14, 30);

  // Summary Box
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 35, pageWidth - 28, 40, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("Executive Summary", 20, 45);
  
  doc.setFontSize(10);
  doc.text(`Total Income: INR ${totalIncome.toLocaleString('en-IN')}`, 20, 55);
  doc.text(`Total Expenses: INR ${totalExpenses.toLocaleString('en-IN')}`, 20, 62);
  doc.text(`Net Savings: INR ${(totalIncome - totalExpenses).toLocaleString('en-IN')}`, 20, 69);

  // AI Suggestions
  doc.setFontSize(14);
  doc.text("AI Insights & Suggestions", 14, 85);
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const splitSummary = doc.splitTextToSize(aiSummary, pageWidth - 28);
  doc.text(splitSummary, 14, 92);

  let currentY = 92 + (splitSummary.length * 5) + 10;

  // Tax-Smart Classification Summary
  if (Object.keys(taxBreakdown).length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Tax-Relevant Expenditure", 14, currentY);
    
    const taxData = Object.entries(taxBreakdown).map(([cat, amt]) => [
      cat.charAt(0).toUpperCase() + cat.slice(1),
      `INR ${amt.toLocaleString('en-IN')}`
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["Tax Category", "Amount"]],
      body: taxData,
      theme: 'striped',
      headStyles: { fillStyle: [70, 70, 70] }
    });
    
    currentY = doc.lastAutoTable.finalY + 15;
  }

  // Transaction List
  doc.setFontSize(14);
  doc.text("Full Transaction List", 14, currentY);

  const tableData = transactions.map(t => [
    new Date(t.date).toLocaleDateString(),
    t.description,
    t.category,
    t.taxCategory || '-',
    t.type,
    `INR ${t.amount.toLocaleString('en-IN')}`
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Date", "Description", "Category", "Tax Tag", "Type", "Amount"]],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 8 }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`SAMPAT AI Financial Advisor - Page ${i} of ${pageCount}`, pageWidth - 70, doc.internal.pageSize.height - 10);
  }

  doc.save(`SAMPAT_Report_${monthName}_${period.year}.pdf`);
};
