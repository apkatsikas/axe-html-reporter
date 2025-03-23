import fs, { existsSync, writeFileSync } from 'fs';
import { Resource, scripts, styleSheets } from '../externalResources';
import https from 'https';
import { basename, join } from 'path';

export const defaultReportFileName = 'accessibilityReport.html';

interface SaveReportOptions {
    htmlContent: string;
    reportFileName?: string;
    outputDir?: string;
    outputDirPath?: string;
    serveResources?: boolean;
}
/**
 * Saves the file with specified file name or with default file name index.thml
 * @param htmlContent
 * @param fileName
 */
export function saveHtmlReport({
    htmlContent,
    reportFileName,
    outputDir,
    outputDirPath = process.cwd(),
    serveResources
}: SaveReportOptions): void {
    try {
        const reportDirectory = `${outputDirPath}/${outputDir || 'artifacts'}`;
        if (!fs.existsSync(reportDirectory)) {
            fs.mkdirSync(reportDirectory, {
                recursive: true,
            });
        }

        if (serveResources) {
            for (var styleSheet of styleSheets) {
                downloadAndVerifyResource(styleSheet, reportDirectory);
            }
            for (var script of scripts) {
                downloadAndVerifyResource(script, reportDirectory);
            }
        }

        const reportFilePath = `${reportDirectory}/${reportFileName || defaultReportFileName}`;
        fs.writeFileSync(reportFilePath, htmlContent);
        console.info(`HTML report was saved into the following directory ${reportFilePath}`);
    } catch (err) {
        console.error(`Error happened while trying to save html report. ${err}`);
    }
}

function downloadAndVerifyResource(resource: Resource, reportDirectory: string): Promise<void> {
    const filePath = join(reportDirectory, basename(resource.path));

    if (existsSync(filePath)) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        https.get(resource.path, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to download from ${resource.path}. Status: ${response.statusCode}`));
            }

            let data = '';

            // Collect the response data
            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                if (resource.integrity) {
                    const integrityValid = verifyIntegrity(data, resource.integrity);
                    if (!integrityValid) {
                        return reject(new Error(`Integrity check failed for ${resource.path}`));
                    }
                }

                writeFileSync(filePath, data);
                resolve();
            });

            response.on('error', (err) => {
                reject(new Error(`Error downloading resource: ${err.message}`));
            });
        });
    });
}

async function verifyIntegrity(content: string, expectedIntegrity: string): Promise<boolean> {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha384');
    hash.update(content);
    const calculatedHash = hash.digest('base64');

    return calculatedHash === expectedIntegrity;
}
