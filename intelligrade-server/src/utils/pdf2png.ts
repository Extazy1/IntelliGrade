type ConverterModule = typeof import("pdf-to-png-converter");

let converterPromise: Promise<ConverterModule> | null = null;

const ensureProcessPolyfills = () => {
    const proc = process as unknown as {
        getBuiltinModule?: (moduleName: string) => any;
    };

    if (typeof proc.getBuiltinModule === "function") {
        return;
    }

    const moduleBuiltin: typeof import("module") = require("module");

    proc.getBuiltinModule = (moduleName: string) => {
        if (moduleName === "module") {
            return moduleBuiltin;
        }

        if (moduleBuiltin.builtinModules?.includes(moduleName)) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require(moduleName);
        }

        return undefined;
    };
};

const loadConverter = async (): Promise<ConverterModule> => {
    ensureProcessPolyfills();

    if (!converterPromise) {
        converterPromise = import("pdf-to-png-converter");
    }

    return converterPromise;
};

export default async function pdf2png(pdfPath: string, outputFolder: string) {
    const { pdfToPng } = await loadConverter();

    await pdfToPng(pdfPath, {
        viewportScale: 3,
        outputFolder,
        outputFileMaskFunc: (pageNumber) => `page-${pageNumber - 1}.png`,
    });
    console.log('PDF -> PNG done');
}