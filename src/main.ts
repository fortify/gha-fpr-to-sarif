import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import {spawnSync} from 'child_process'

async function installSarifMultitool() : Promise<string> {
    const toolPath = fs.mkdtempSync(path.join(os.tmpdir(), 'sarif-'));
    await exec.exec('dotnet', ['tool', 'install', '--tool-path', toolPath, 'Sarif.Multitool']);
    return path.join(toolPath, 'sarif');
}

function getOutput(fpr: string) : string {
    const outputDir = core.getInput('outputDir', { required: true });
    if (!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }
    const baseFileName = path.basename(fpr, '.fpr');
    return `${outputDir}/${baseFileName}.sarif`;
}

async function convertFile(multitoolPath: string, fprFile : string) : Promise<void> {
    exec.exec(multitoolPath, ['convert', fprFile, '-t', 'FortifyFpr', '-o', getOutput(fprFile), '-f', '-p']);
}

async function convertFiles(multitoolPath: string, fprFiles : string[]) : Promise<void> {
    fprFiles.forEach(fprFile => convertFile(multitoolPath, fprFile));
}

async function main() {
    core.info("Running main()");
    installSarifMultitool().then(async function(multitoolPath) {
        const input = core.getInput('input');
        if (fs.lstatSync(input).isDirectory()) {
            const fprFiles = fs.readdirSync(input)
                .filter(f => f.endsWith(".fpr"))
                .map(f => path.resolve(input, f));
            if (fprFiles.length === 0) {
                throw `No FPR files found in "${input}"`;
            }
            return await convertFiles(multitoolPath, fprFiles);
        } else {
            return await convertFiles(multitoolPath, [input]);
        }
    });
}

core.info("Calling main()");

main();