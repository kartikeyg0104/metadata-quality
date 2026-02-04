/**
 * PDF Report Generator
 * Generates professional PDF reports for metadata quality evaluations
 */

import PDFDocument from 'pdfkit';

/**
 * Generate a PDF report buffer
 * @param {Object} evaluation - The evaluation result
 * @param {Object} metadata - The original metadata
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generatePdfReport(evaluation, metadata) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Colors
      const colors = {
        primary: '#1e3a5f',
        secondary: '#3b82f6',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        gray: '#6b7280',
        lightGray: '#f3f4f6'
      };

      // Get grade color
      const getGradeColor = (score) => {
        if (score >= 90) return colors.success;
        if (score >= 80) return '#84cc16';
        if (score >= 70) return colors.warning;
        if (score >= 60) return '#f97316';
        return colors.danger;
      };

      // Header
      doc.fontSize(24)
         .fillColor(colors.primary)
         .text('Metadata Quality Report', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(12)
         .fillColor(colors.gray)
         .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      
      doc.moveDown(1.5);
      
      // Dataset Info Box
      doc.rect(50, doc.y, 495, 70)
         .fill(colors.lightGray);
      
      const boxY = doc.y + 15;
      doc.fillColor(colors.primary)
         .fontSize(14)
         .text('Dataset:', 70, boxY, { continued: true })
         .fillColor('#000')
         .text(` ${metadata.title || 'Untitled Dataset'}`);
      
      if (metadata.authors && metadata.authors.length > 0) {
        doc.fillColor(colors.primary)
           .text('Authors:', 70, boxY + 20, { continued: true })
           .fillColor('#000')
           .text(` ${Array.isArray(metadata.authors) ? metadata.authors.join(', ') : metadata.authors}`);
      }
      
      if (metadata.publication_date) {
        doc.fillColor(colors.primary)
           .text('Date:', 70, boxY + 40, { continued: true })
           .fillColor('#000')
           .text(` ${metadata.publication_date}`);
      }

      doc.y = boxY + 70;
      doc.moveDown(1);

      // Overall Score Section
      const score = evaluation.overall_score;
      const grade = evaluation.grade;
      const scoreColor = getGradeColor(score);

      doc.fontSize(18)
         .fillColor(colors.primary)
         .text('Overall Quality Score', { align: 'center' });
      
      doc.moveDown(0.5);
      
      // Score circle representation
      const centerX = 297.5;
      const scoreY = doc.y + 30;
      
      doc.circle(centerX, scoreY, 40)
         .lineWidth(6)
         .stroke(scoreColor);
      
      doc.fontSize(28)
         .fillColor(scoreColor)
         .text(score.toString(), centerX - 20, scoreY - 15, { width: 40, align: 'center' });
      
      doc.y = scoreY + 50;
      
      doc.fontSize(16)
         .fillColor(scoreColor)
         .text(`Grade: ${grade.grade} - ${grade.label}`, { align: 'center' });
      
      doc.moveDown(0.3);
      doc.fontSize(10)
         .fillColor(colors.gray)
         .text(grade.description, { align: 'center' });

      doc.moveDown(1.5);

      // Category Breakdown Section
      doc.fontSize(16)
         .fillColor(colors.primary)
         .text('Category Breakdown');
      
      doc.moveDown(0.5);
      
      const categories = evaluation.categories || {};
      const barWidth = 300;
      const barHeight = 18;
      let barY = doc.y;

      for (const [category, catScore] of Object.entries(categories)) {
        // Category name
        doc.fontSize(10)
           .fillColor('#000')
           .text(category.charAt(0).toUpperCase() + category.slice(1), 50, barY);
        
        // Score value
        doc.text(`${catScore}%`, 480, barY, { width: 40, align: 'right' });
        
        // Background bar
        doc.rect(200, barY + 2, barWidth, barHeight - 4)
           .fill('#e5e7eb');
        
        // Score bar
        const scoreWidth = (catScore / 100) * barWidth;
        doc.rect(200, barY + 2, scoreWidth, barHeight - 4)
           .fill(getGradeColor(catScore));
        
        barY += 25;
      }

      doc.y = barY + 10;
      doc.moveDown(1);

      // Summary Statistics
      if (evaluation.summary) {
        doc.fontSize(16)
           .fillColor(colors.primary)
           .text('Summary Statistics');
        
        doc.moveDown(0.5);
        
        const summary = evaluation.summary;
        doc.fontSize(10)
           .fillColor('#000');
        
        const statsY = doc.y;
        doc.text(`Total Rules: ${summary.total_rules}`, 70, statsY);
        doc.text(`Passed: ${summary.passed}`, 200, statsY);
        doc.text(`Failed: ${summary.failed}`, 330, statsY);
        doc.text(`Pass Rate: ${summary.pass_rate}%`, 460, statsY);
        
        doc.moveDown(1.5);
      }

      // Recommendations Section
      if (evaluation.recommendations && evaluation.recommendations.length > 0) {
        doc.fontSize(16)
           .fillColor(colors.primary)
           .text('Recommendations');
        
        doc.moveDown(0.5);
        
        const maxRecs = Math.min(evaluation.recommendations.length, 10);
        for (let i = 0; i < maxRecs; i++) {
          const rec = evaluation.recommendations[i];
          doc.fontSize(10)
             .fillColor(colors.secondary)
             .text(`${i + 1}.`, 50, doc.y, { continued: true })
             .fillColor('#000')
             .text(` ${rec}`, { width: 480 });
          doc.moveDown(0.5);
        }
        
        if (evaluation.recommendations.length > maxRecs) {
          doc.fontSize(9)
             .fillColor(colors.gray)
             .text(`... and ${evaluation.recommendations.length - maxRecs} more recommendations`);
        }
      }

      // Footer
      const pageHeight = doc.page.height;
      doc.fontSize(8)
         .fillColor(colors.gray)
         .text(
           'Generated by Metadata Quality Platform | Rule-based metadata quality evaluation',
           50,
           pageHeight - 50,
           { align: 'center', width: 495 }
         );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export default { generatePdfReport };
