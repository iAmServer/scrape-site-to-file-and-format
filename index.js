const scrape = require('website-scraper');
const fs = require('fs-extra');  
const { dirname } = require("path");

/**
 * Reads the js directory and load the content of a valid js file.
 *
 * @param dirname {string} directory path
 * @returns {Promise<string[][]>} array of string array
 */
const readFiles = dirname => {
    return new Promise(async (resolve, reject) => {
        try {
            const folders = await fs.readdir(dirname);
            const isExist = folders.find(filename => filename === 'js');

            if (isExist) {
                const filenames = await fs.readdir(`${dirname}/js`);
                const files_promise = filenames.map(filename => {
                    if (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.jsx') || filename.endsWith('.tsx')) {
                        return fs.readFile(`${dirname}/js/${filename}`, 'utf8');
                    }
                });
                const response = await Promise.all(files_promise);
    
                resolve(response);
            } else {
                reject({ reason: 'scrapped site does not include a js folder' });
            }
        } catch (error) {
            reject(error);
        }
    });
};  

/**
 * Scrapes the website and return array of unique machine IDs.
 *
 * @param config {{urls: string[], directory: string}} Config
 * @param removeDirectory {boolean} Do you want to delete output directory (default: true)
 * @returns {Promise<string[]>} unique machine IDs
 */
const scrapeWebsite = (config, removeDirectory = true) => {
    const options = {
        ...{
            urls: [],
            directory: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) // generate a unique directory name per scrape
        },
        ...config 
    };
    
    console.log('SCRAPING: ', options.urls);
    return new Promise((resolve, reject) => {
        scrape(options).then(async () => {
            console.log('SCRAPING COMPLETE');
            console.log('READING FILES');
            const appDir = dirname(options.directory);
            const file = `${appDir}/${options.directory}`;
            const output = [];
            const res = await readFiles(file);
        
            console.log('READING FILES COMPLETE');
            console.log('FILTERING UNIQUE MACHINE IDS');
            res.forEach(str => {
                const regex = /REACT_APP_CANDY_MACHINE_ID:"[a-zA-Z]+(\d([a-zA-Z]+\d)+)[a-zA-Z]+"/g;
                const result = str.match(regex);

                if (result) {
                    output.push(result);
                }
            });

            let final_array = [...new Set(output.reduce((acc, curr) => acc.concat(curr), []))];
            final_array = final_array.map(el => {
                el = el.replace(/REACT_APP_CANDY_MACHINE_ID:"/g, '');
                el = el.replace(/"/g, '');
                return el;
            });

            console.log(final_array);

            if (removeDirectory) {
                console.log('REMOVING DIRECTORY');
                await fs.remove(file);
                console.log('REMOVING DIRECTORY COMPLETE');
            }

            resolve(final_array)
        }).catch((err) => {
            console.log(err);
            reject(err);
        });
    });
}

scrapeWebsite({
    urls: ['https://deathlymint1.mortuary-inc.io/']
}, false);

module.exports = scrapeWebsite;