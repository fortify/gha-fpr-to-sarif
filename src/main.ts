import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

async function installSarifMultitool() : Promise<void> {
    await exec.exec('npm', ['install', '-g', '@microsoft/sarif-multitool']);
}

function getOutput(fpr: string) : string {
    const outputDir = core.getInput('outputDir', { required: true });
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }
    const baseFileName = path.basename(fpr, '.fpr');
    return `${outputDir}/${baseFileName}.sarif`;
}

async function convertFile(fprFile : string) : Promise<void> {
    exec.exec('npx', ['@microsoft/sarif-multitool', 'convert', fprFile, '-t', 'FortifyFpr', '-o', getOutput(fprFile), '-f', '-p']);
}

async function convertFiles(fprFiles : string[]) : Promise<void> {
    fprFiles.forEach(fprFile => convertFile(fprFile));
}

async function main() {
    core.info("Running main()");
    installSarifMultitool().then(async function() {
        const input = core.getInput('input');
        if (fs.lstatSync(input).isDirectory()) {
            const fprFiles = fs.readdirSync(input)
                .filter(f => f.endsWith(".fpr"))
                .map(f => path.resolve(input, f));
            if (fprFiles.length === 0) {
                throw `No FPR files found in "${input}"`;
            }
            return await convertFiles(fprFiles);
        } else {
            return await convertFiles([input]);
        }
    });
}

core.info("Calling main()");

main();