import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export class PDFWatermarkService {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Generate QR Code as base64 image
   */
  async generateQRCode(url) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 80,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Add watermark footer to PDF
   */
  async addWatermarkToPDF(inputPdfPath, outputPdfPath, purchaseData) {
    try {
      // Read the existing PDF
      const existingPdfBytes = fs.readFileSync(inputPdfPath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // Get pages
      const pages = pdfDoc.getPages();
      
      // Generate QR code
      const verificationUrl = `${this.baseUrl}/sheet-music/eprint-purchase-history?ePrintPurchaseId=${purchaseData.purchaseId}&ePrintPurchaseUUID=${purchaseData.purchaseUUID}`;
      const qrCodeDataUrl = await this.generateQRCode(verificationUrl);
      
      // Convert QR code to PDF image
      const qrCodeImageBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      const qrCodeImage = await pdfDoc.embedPng(qrCodeImageBytes);
      
      // Get font
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Format date
      const purchaseDate = new Date(purchaseData.purchaseDate).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Footer text
      const footerText = `Izin Penggunaan Lagu ini diberikan kepada Paduan Suara '${purchaseData.choirName}' melalui '${purchaseData.buyerName}' pada tanggal ${purchaseDate}`;
      const copyText = `${purchaseData.quantity} copy sold to ${purchaseData.buyerName} by ACA Publishing on ${new Date(purchaseData.purchaseDate).toLocaleDateString('en-US')}`;
      
      // Add footer to each page
      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        
        // Footer background (light gray)
        page.drawRectangle({
          x: 0,
          y: 0,
          width: width,
          height: 60,
          color: rgb(0.95, 0.95, 0.95),
          opacity: 0.8
        });
        
        // Main footer text
        const textWidth = font.widthOfTextAtSize(footerText, 8);
        const maxTextWidth = width - 100; // Leave space for QR code
        
        if (textWidth > maxTextWidth) {
          // Split text into multiple lines if too long
          const words = footerText.split(' ');
          let line1 = '';
          let line2 = '';
          let currentLine = 1;
          
          words.forEach(word => {
            const testLine = currentLine === 1 ? line1 + ' ' + word : line2 + ' ' + word;
            const testWidth = font.widthOfTextAtSize(testLine.trim(), 8);
            
            if (testWidth > maxTextWidth && currentLine === 1) {
              currentLine = 2;
              line2 = word;
            } else if (testWidth > maxTextWidth && currentLine === 2) {
              // If still too long, truncate
              line2 += '...';
            } else {
              if (currentLine === 1) {
                line1 = testLine.trim();
              } else {
                line2 = testLine.trim();
              }
            }
          });
          
          // Draw two lines
          page.drawText(line1, {
            x: 10,
            y: 35,
            size: 8,
            font: font,
            color: rgb(0.2, 0.2, 0.2)
          });
          
          page.drawText(line2, {
            x: 10,
            y: 25,
            size: 8,
            font: font,
            color: rgb(0.2, 0.2, 0.2)
          });
        } else {
          // Single line
          page.drawText(footerText, {
            x: 10,
            y: 30,
            size: 8,
            font: font,
            color: rgb(0.2, 0.2, 0.2)
          });
        }
        
        // Copy information
        page.drawText(copyText, {
          x: 10,
          y: 15,
          size: 6,
          font: font,
          color: rgb(0.4, 0.4, 0.4)
        });
        
        // QR Code
        const qrSize = 45;
        page.drawImage(qrCodeImage, {
          x: width - qrSize - 10,
          y: 8,
          width: qrSize,
          height: qrSize
        });
        
        // Page number
        page.drawText(`${index + 1}`, {
          x: width - 25,
          y: height - 20,
          size: 8,
          font: font,
          color: rgb(0.5, 0.5, 0.5)
        });
      });
      
      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPdfPath, pdfBytes);
      
      return {
        success: true,
        outputPath: outputPdfPath,
        verificationUrl: verificationUrl
      };
      
    } catch (error) {
      console.error('Error adding watermark to PDF:', error);
      throw error;
    }
  }

  /**
   * Process PDF for purchase
   */
  async processPurchasePDF(originalPdfPath, purchaseData) {
    try {
      // Create watermarked directory if it doesn't exist
      const watermarkedDir = path.join(process.cwd(), 'public', 'watermarked-pdfs');
      if (!fs.existsSync(watermarkedDir)) {
        fs.mkdirSync(watermarkedDir, { recursive: true });
      }
      
      // Generate output filename
      const timestamp = Date.now();
      const outputFilename = `${purchaseData.purchaseId}-${timestamp}.pdf`;
      const outputPath = path.join(watermarkedDir, outputFilename);
      
      // Add watermark
      const result = await this.addWatermarkToPDF(originalPdfPath, outputPath, purchaseData);
      
      return {
        ...result,
        relativePath: `/watermarked-pdfs/${outputFilename}`
      };
      
    } catch (error) {
      console.error('Error processing purchase PDF:', error);
      throw error;
    }
  }
}

export default new PDFWatermarkService();