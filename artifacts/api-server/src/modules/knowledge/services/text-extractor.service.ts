// =============================================================================
// TextExtractorService — Extração de texto puro de diferentes formatos
//
// Suporta: PDF, DOCX, XLSX/XLS, TXT, CSV, HTML/URL
// Retorna sempre uma string de texto limpo para o chunker.
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TextExtractorService {
  private readonly logger = new Logger(TextExtractorService.name);

  /**
   * Extrai texto de um buffer de arquivo.
   *
   * @param buffer    Conteúdo do arquivo em memória
   * @param mimeType  MIME type para determinar o extrator
   * @param filename  Nome original (fallback para detecção por extensão)
   */
  async extractFromBuffer(
    buffer: Buffer,
    mimeType: string,
    filename = '',
  ): Promise<string> {
    const ext = path.extname(filename).toLowerCase();

    if (mimeType === 'application/pdf' || ext === '.pdf') {
      return this.extractPdf(buffer);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      ext === '.docx' || ext === '.doc'
    ) {
      return this.extractDocx(buffer);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel' ||
      ext === '.xlsx' || ext === '.xls'
    ) {
      return this.extractXlsx(buffer);
    }

    if (mimeType === 'text/csv' || ext === '.csv') {
      return this.extractCsv(buffer);
    }

    if (mimeType.startsWith('text/') || ext === '.txt' || ext === '.md') {
      return buffer.toString('utf-8');
    }

    // Tenta como texto UTF-8 como fallback
    this.logger.warn(`Unknown mimeType "${mimeType}" — attempting UTF-8 decode`);
    return buffer.toString('utf-8');
  }

  /**
   * Extrai texto de um arquivo no disco.
   */
  async extractFromPath(filePath: string, mimeType: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    return this.extractFromBuffer(buffer, mimeType, path.basename(filePath));
  }

  /**
   * Extrai texto de uma URL/site via HTTP.
   */
  async extractFromUrl(url: string): Promise<string> {
    const axios = await import('axios');
    const cheerio = await import('cheerio');

    const response = await axios.default.get<string>(url, {
      timeout: 15_000,
      headers: { 'User-Agent': 'WhatsApp-AI-Bot/1.0 (knowledge-crawler)' },
      responseType: 'text',
      maxContentLength: 10 * 1024 * 1024, // 10 MB max
    });

    const html: string = typeof response.data === 'string'
      ? response.data
      : String(response.data);

    const $ = cheerio.load(html);

    // Remove elementos não-conteúdo
    $('script, style, noscript, nav, footer, header, aside, [role="navigation"]').remove();
    $('[aria-hidden="true"]').remove();

    // Extrai texto dos elementos principais
    const text = $('main, article, .content, .post, body')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    if (!text || text.length < 50) {
      // Fallback: pega todo o body text
      return $('body').text().replace(/\s+/g, ' ').trim();
    }

    return text;
  }

  // ─── Extratores privados ───────────────────────────────────────────────────

  private async extractPdf(buffer: Buffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return data.text.replace(/\s+/g, ' ').trim();
  }

  private async extractDocx(buffer: Buffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth') as {
      extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }>;
    };
    const result = await mammoth.extractRawText({ buffer });
    return result.value.replace(/\s+/g, ' ').trim();
  }

  private extractXlsx(buffer: Buffer): string {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require('xlsx') as typeof import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const lines: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet!, {
        header: 1,
        defval: '',
      }) as unknown[][];

      lines.push(`--- Planilha: ${sheetName} ---`);

      for (const row of rows) {
        const rowText = (row as unknown[])
          .map((cell) => String(cell ?? '').trim())
          .filter(Boolean)
          .join(' | ');
        if (rowText) lines.push(rowText);
      }
    }

    return lines.join('\n');
  }

  private extractCsv(buffer: Buffer): string {
    const text = buffer.toString('utf-8');
    // Converte CSV em texto legível (linhas com | separador)
    return text
      .split('\n')
      .map((line) =>
        line
          .split(',')
          .map((cell) => cell.replace(/^"|"$/g, '').trim())
          .filter(Boolean)
          .join(' | '),
      )
      .filter(Boolean)
      .join('\n');
  }
}
