import fs from 'fs';
import { scripts, styleSheets } from '../resources';
import downloadAndVerifyResource from './downloadAndVerifyResources';

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
export async function saveHtmlReport({
    htmlContent,
    reportFileName,
    outputDir,
    outputDirPath = process.cwd(),
    serveResources
}: SaveReportOptions): Promise<void> {
    try {
        const reportDirectory = `${outputDirPath}/${outputDir || 'artifacts'}`;
        if (!fs.existsSync(reportDirectory)) {
            fs.mkdirSync(reportDirectory, {
                recursive: true,
            });
        }

        if (serveResources) {
            const resources = [...styleSheets, ...scripts];
            const downloadPromises = resources.map(resource => downloadAndVerifyResource(resource, reportDirectory));
            await Promise.all(downloadPromises);
        }

        const reportFilePath = `${reportDirectory}/${reportFileName || defaultReportFileName}`;
        fs.writeFileSync(reportFilePath, htmlContent);
        console.info(`HTML report was saved into the following directory ${reportFilePath}`);
    } catch (err) {
        console.error(`Error happened while trying to save html report. ${err}`);
    }
}
