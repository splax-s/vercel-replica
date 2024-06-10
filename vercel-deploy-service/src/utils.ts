// import { exec, spawn } from "child_process";
// import path from "path";

// export function buildProject(id: string) {
//     return new Promise((resolve) => {
//         const child = exec(`cd ${path.join(__dirname, `output/${id}`)} && npm install && npm run build`)

//         child.stdout?.on('data', function(data) {
//             console.log('stdout: ' + data);
//         });
//         child.stderr?.on('data', function(data) {
//             console.log('stderr: ' + data);
//         });

//         child.on('close', function(code) {
//            resolve("")
//         });

//     })

// }

import { spawn, SpawnOptionsWithoutStdio } from "child_process";
import path from "path";

export function buildProject(id: string, packageManager: string = "npm") {
    return new Promise<void>((resolve, reject) => {
        const projectPath = path.join(__dirname, `output/${id}`);
        let installCommand: string[];
        let buildCommand: string[];

        // Define the install and build commands based on the package manager
        if (packageManager === "yarn") {
            installCommand = ["yarn"];
            buildCommand = ["yarn", "build"];
        } else if (packageManager === "bun") {
            installCommand = ["bun", "install"];
            buildCommand = ["bun", "run", "build"]; // Assuming npm is used for building with bun
        } else { // Default to npm
            installCommand = ["npm", "install"];
            buildCommand = ["npm", "run", "build"];
        }

        const installChild = spawn(installCommand[0], installCommand.slice(1), {
            cwd: projectPath,
            stdio: "pipe" // to capture stdout and stderr
        });

        installChild.stdout.on('data', function(data) {
            console.log(`stdout (${packageManager} install): ` + data);
        });

        installChild.stderr.on('data', function(data) {
            console.error(`stderr (${packageManager} install): ` + data);
        });

        installChild.on('close', function(installCode) {
            if (installCode === 0) {
                const spawnOptions: SpawnOptionsWithoutStdio = {
                    cwd: projectPath,
                    stdio: "pipe" // to capture stdout and stderr
                };

                const buildChild = spawn(buildCommand[0], buildCommand.slice(1), spawnOptions);

                buildChild.stdout.on('data', function(data) {
                    console.log(`stdout (${packageManager} run build): ` + data);
                });

                buildChild.stderr.on('data', function(data) {
                    console.error(`stderr (${packageManager} run build): ` + data);
                });

                buildChild.on('close', function(buildCode) {
                    if (buildCode === 0) {
                        resolve();
                    } else {
                        reject(new Error(`Build process failed with code ${buildCode}`));
                    }
                });
            } else {
                reject(new Error(`${packageManager} install process failed with code ${installCode}`));
            }
        });
    });
}

