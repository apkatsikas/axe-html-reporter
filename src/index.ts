import mustache from 'mustache';
import { AxeResults, Result } from 'axe-core';
import { loadTemplate } from './util/loadTemplate';
import { prepareReportData } from './util/prepareReportData';
import { prepareAxeRules } from './util/prepareAxeRules';
import { saveHtmlReport } from './util/saveHtmlReport';

const styleSheets: StyleSheets = [
    {
        link: 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
        integrity: 'sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z'
    },
    {
        link: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.5.0/styles/stackoverflow-light.min.css',
    }
];

const scripts: Scripts = [
    {
        link: 'https://code.jquery.com/jquery-3.2.1.slim.min.js',
        integrity: 'sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN'
    },
    {
        link: 'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js',
        integrity: 'sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q'
    },
    {
        link: 'https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js',
        integrity: 'sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl'
    },
    {
        link: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.5.0/highlight.min.js',
    },
];

interface ExternalResource {
    link: string;
    integrity?: string;
}

type StyleSheets = ExternalResource[];
type Scripts = ExternalResource[];

export interface Options {
    reportFileName?: string;
    outputDir?: string;
    projectKey?: string;
    customSummary?: string;
    outputDirPath?: string;
    doNotCreateReportFile?: boolean;
}

export interface CreateReport {
    results: Partial<AxeResults>;
    options?: Options;
}

export interface PreparedResults {
    violations: Result[];
    passes?: Result[];
    incomplete?: Result[];
    inapplicable?: Result[];
}

export function createHtmlReport({ results, options }: CreateReport): string {
    if (!results.violations) {
        throw new Error(
            "'violations' is required for HTML accessibility report. Example: createHtmlReport({ results : { violations: Result[] } })"
        );
    }
    try {
        const template = loadTemplate();
        const preparedReportData = prepareReportData({
            violations: results.violations,
            passes: results.passes,
            incomplete: results.incomplete,
            inapplicable: results.inapplicable
        });
        const htmlContent = mustache.render(template, {
            url: results.url,
            violationsSummary: preparedReportData.violationsSummary,
            violations: preparedReportData.violationsSummaryTable,
            violationDetails: preparedReportData.violationsDetails,
            checksPassed: preparedReportData.checksPassed,
            checksIncomplete: preparedReportData.checksIncomplete,
            checksInapplicable: preparedReportData.checksInapplicable,
            hasPassed: Boolean(results.passes),
            hasIncomplete: Boolean(results.incomplete),
            hasInapplicable: Boolean(results.inapplicable),
            incompleteTotal: preparedReportData.checksIncomplete
                ? preparedReportData.checksIncomplete.length
                : 0,
            projectKey: options?.projectKey,
            customSummary: options?.customSummary,
            hasAxeRawResults: Boolean(results?.timestamp),
            rules: prepareAxeRules(results?.toolOptions?.rules || {}),
            scripts,
            styleSheets
        });
        if (!options || options.doNotCreateReportFile === undefined || !options.doNotCreateReportFile) {
            saveHtmlReport({
                htmlContent,
                reportFileName: options?.reportFileName,
                outputDir: options?.outputDir,
                outputDirPath: options?.outputDirPath
            });
        }

        return htmlContent;
    } catch (e) {
        // @ts-ignore
        console.warn(`HTML report was not created due to the error ${e.message}`);

        // @ts-ignore
        return `Failed to create HTML report due to an error ${e.message}`;
    }
}
