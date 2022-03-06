import gulp from 'gulp';
import zip from 'gulp-zip';
import tsify from 'tsify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import del from 'del';
import ts from 'gulp-typescript';
import Jasmine from 'jasmine';
import decache from 'decache';
import Jimp from 'jimp';
import puppeteer from 'puppeteer';

// The directory where generated extension files are placed.
// You can load the extension directory from the directory via "Load unpacked".
const outDir = './extension';

// Compile and bundle a set of TypeScript files into one Js file.
const compileTs = (srcFiles, outputFile) => {
    return browserify()
        .add(srcFiles)
        .plugin(tsify, { noImplicitAny: true, target: 'es6' })
        .bundle()
        .on('error', (err) => { console.error(err) })
        .pipe(source(outputFile))
        .pipe(gulp.dest(outDir))
}

// Background Script
const backgroundScript = ['src/background-script/background.ts'];
const compileBackgroundScript = () => {
    return compileTs(backgroundScript, 'background.js');
}
const watchBackgroundScript = () => {
    gulp.watch(backgroundScript, gulp.parallel(compileBackgroundScript));
}

// Content Script
const contentScript = ['src/content-script/content-script.ts'];
const compileContentScript = () => {
    return compileTs(contentScript, 'content-script.js');
}
const watchContentScript = () => {
    gulp.watch(contentScript, gulp.parallel(compileContentScript));
}

// Popup
const popupScript = [];
const compilePopupScript = () => {
    return compileTs(popupScript, 'popup.js');
}
const watchPopupScript = () => {
    gulp.watch(popupScript, gulp.parallel(compilePopupScript));
}

// Assets
const assets = ['assets/**/*'];
const originalIconPath = 'assets/images/icon.png'; // png scale better than jpeg for resizing purposes.
const copyAssets = () => {
    return gulp.src(assets)
        .pipe(gulp.dest(outDir));
}
const watchAssets = () => {
    gulp.watch(assets, copyAssets);
}
const generateIcons = () => {
    return new Promise((resolve, reject) => {
        Jimp.read(originalIconPath, (err, icon) => {
            if (err) {
                reject();
            }
            for (let size of [16, 24, 32, 48, 128]) {
                const colorIcon = icon.clone();
                colorIcon.resize(size, size)
                    .write(`assets/images/icon-${size}x${size}.png`);
                const grayIcon = icon.clone();
                grayIcon.resize(size, size)
                    .greyscale()
                    .write(`assets/images/icon-gray-${size}x${size}.png`);
            }
            resolve();
        });
    });
}

// Packaging
const clean = () => del([outDir]);
const build = gulp.series(clean, gulp.parallel(copyAssets, compileBackgroundScript, compileContentScript, compilePopupScript));
// TODO: Add a minify task for pack.
const pack = gulp.series(build, () => {
    return gulp.src('extension/*')
        .pipe(zip('extension.zip'))
        .pipe(gulp.dest('dist'))
});
const launchChrome = () => {
    puppeteer.launch({
        headless: false,
        ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
        args: [
            `--disable-extensions-except=${process.env.PWD}/extension`,
            `--load-extension=${process.env.PWD}/extension`,
        ]
    });
};

// Tests
const testSpecs = ['spec/**/*.ts'];
const compileTests = () => {
    return gulp.src(testSpecs)
        .pipe(ts({
            noImplicitAny: true,
        }))
        .pipe(gulp.dest('spec'));
}
const runTest = () => {
    return new Promise((resolve, reject) => {
        const jasmine = new Jasmine();
        jasmine.loadConfig({
            spec_files: ['spec/**/*.js'],
            random: false,
        });
        jasmine.onComplete(passed => {
            // multiple execute calls on jasmine env errors. See https://github.com/jasmine/jasmine/issues/1231#issuecomment-26404527
            jasmine.specFiles.forEach(f => decache(f));
            resolve();
        });
        jasmine.execute();
    });
}
const test = gulp.series(build, compileTests, runTest);
const watchTests = () => {
    return gulp.watch(testSpecs, test);
}

// Exported tasks
// These can be invoked by running: gulp <task>
export const Build = build;
Build.description = "Clean output directory and re-generate extension files from source.";

export const Test = test;
Test.description = "Compile and run all tests in the /spec directory";

export const WatchTests = watchTests;
WatchTests.description = "Watch changes in test files and re-run tests";

export const ChromeDemo = gulp.series(build, launchChrome);
ChromeDemo.description = "Start a chrome instance with the extension installed";

export const Pack = pack;
Pack.description = "Create a .zip file that can be uploaded to extension stores (Chrome or Firefox)";

export const GenerateIcons = generateIcons;
GenerateIcons.description = "Use assets/images/icon.png to generate the set of required icons";

export const DefaultTask = gulp.series(build, gulp.parallel(watchBackgroundScript, watchContentScript, watchAssets, watchPopupScript))
DefaultTask.description = 'Generate extension files, watch for changes and regenerate'

// The default task is what runs when you simply run `gulp` without any arguments.
export default DefaultTask;