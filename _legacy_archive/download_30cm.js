import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SIZE = '30cm';
const OUTPUT_DIR = path.join(__dirname, 'public', 'Site_Pics', 'Decals', SIZE);

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const decals = [
  {
    "url": "https://lh3.googleusercontent.com/sitesv/APaQ0SS_O0Yq83JCVuwk7ubJHKs9kZBb3zBRD9eWEoq8Q2BgZC6hquUuLJl6qBH45_RKQll6JlYq0KyEdJOKszm9kb5Gj8PEyfLooG8HQQhJDdYZVd0GWvNZheT-wRyftYMRe51uztr-gCoczBIofoxgCoBLC-6vgQJZcQPpc4hxhzhMp1-6LjwG-p79tXopVlde7-qNmGFyyOQx-hr7QxWe8OU-z7zbclMktEEygjE=w1280",
    "nomenclature": "30cm-01"
  },
  {
    "url": "https://lh3.googleusercontent.com/sitesv/APaQ0SRBvHdPKNr9bVaytuOBy3OutEW4xRxF4j-GzYA85cBeuHF1V9UURHy85MYH5AgNzqXvBqcYjc80IOz8ylq2lUe_sAyflM2pLyxK9RD9emb13PiB4lWuYtq1Y1KFywDbGkBKqMOAwHEAIiQo2mEyOi7JwGQ3EMIlY02iCF---DeOa-N6PIXKT4NbWlhVD9z2VHL-LSy4qs-TkQ9wKHRYxqne2PfgRZ2qpEd6638=w1280",
    "nomenclature": "30cm-02"
  },
  {
    "url": "https://lh3.googleusercontent.com/sitesv/APaQ0SSUfyW2s4tpdBGjKEBqsBWRImS5KxvwKequg-kRvIX_GOJBhaYgw2y8UBzvvHcjKCIOx1l8FVnm9sDDynCt_LPnQyZmeK2T6TAtfSjjnYv37sJHxkcNQWSJ6ufBb6yF2QUYWNch3a5VaVHJDLLI3CSbnrgBdwBftL2GVpgzhtOZouGF-qZyq1SVwIG_5Io87nvgXxFKoTTum2XJ4o-fA8pI_EI7ytEKnA=w1280",
    "nomenclature": "30cm-03"
  },
  {
    "url": "https://lh3.googleusercontent.com/sitesv/APaQ0SQAoaMgKTHHJuObf3qmnSpCU62houIfm2dJp3q3cxwmOmwuTzxwkTCkKOzw6Xb-TmE6KhoVfL2gNGfRi4rfo8NhVhh-i8NYWpgS1lJ3X3IfizFmBoiWGkcWHqavhxwrqXq-kj0ERkC8TdnhF9uOGpjXZJjNzoJs034oKaADkcc1RUHGifzaq_9_SmBKYrNHyuOuFvZrS9puXc6ZCwz13h5KzwTOKY1ZfCQ=w1280",
    "nomenclature": "30cm-04"
  },
  {
    "url": "https://lh3.googleusercontent.com/sitesv/APaQ0SQ8R2zqzKWzuqtbon4HGWnwQv14jo5sqE40KgpwfXpshJQu4LqCNViCjT-OhWnWNKG8SRWGmu2gT0PxxZuy1VZYePMph4Ep6PINV7oFWooKZpeMpVeI44k8Wye9Ffq2jJsn6wd7FiDT8HgPfX9pUG8QYM8rczXp14jGPwgUytiLnQEh9B5bTc-FGyglfnyN9RRv11kGH1CWKlvn5OOTP8wcGxyHGE6dZYHYKBQ=w1280",
    "nomenclature": "30cm-05"
  },
  {
    "url": "https://lh3.googleusercontent.com/sitesv/APaQ0ST6zSsbcw0Jw4hMQeKJd3OrM0V0Z44Wzz8DITpl80gP-F8aDSSf-N74OBuSkuDGon5rC0MuhaTq7NURbfzB25vt2xJFAz93KyHVfCb4N84KdZzf31m2-dxDbO4uxqDKd81OkPC9ilMOI2EkEMYaAdJSPYQV3UACur8h7LMfHCKbx0M3vkj80v2Pok9EPjKp1O119eY7hxnVyhZ9rtTtH2jvR8L3ctTS32sI=w1280",
    "nomenclature": "30cm-06"
  },
  {
    "url": "https://lh3.googleusercontent.com/sitesv/APaQ0SRl1K2fDP1eBNbZ8FJ0kgXLKCEt7SLBKykZBG8hCdLNxNq7UboR7hF0E7QcUeE1kHIRO1PHa_49t0PpUCgWvSO4LjJA2uuZUTpNOcs-k4v2aV7kEuabEFnTwkbTGp_ce7VyT5MPewo0BsacVtwTTGtmYZAh7ymLIvtqhhT7KtFATYXqZaCCBjb7GBgVr4EZYL4XNZrf5ykzNhEd5SX4FS-dVzsLBI73v9FwXWM=w1280",
    "nomenclature": "30cm-07"
  },
  {
    "url": "https://lh3.googleusercontent.com/sitesv/APaQ0STlESLYcljwYfaEpJdIMZKrkUg1WvunT2FWpwhXaZha8tnoyjBUp6VDjUF1nDoxHfQb3Q2SG-XfaZWB4q8vZH0aakLa5xqmQ4ZW7AQlQKLS9W7v4nMkp-RjcZCAVQ5kCu7l9G3sdZv8o3OIyJWJWgMDAMfVJU5NpxYOU4ZI2Hb4n7MJ4zU4kmridB8uMidJrxty439z2yfXuxPPygFWMRTIO5gq9lnxSyZJ=w1280",
    "nomenclature": "30cm-08"
  },
  {
    "url": "https://lh3.googleusercontent.com/sitesv/APaQ0SSN4rW8nPCmM1RWprOOlbVpmtThNm_lD4vwsaTyGWHDjqgACpB5qShijqTGzuw1VhcmXTgewnjNW02S02wBUpGwLFmTksAF1h213TJLEXQOZP7_0kmxMB6LNrwoUppMpqFdMPbW54nNCvZjZ0dPQRM3daghWiVaewbOHSUQOkZwnX5kvVldHS-zmdDiRT5EzZLDxeq26MXFOC_2NAEpqwGc96ThJ5qMiGTeHQA=w1280",
    "nomenclature": "30cm-09"
  },
  {
    "url": "https://lh3.googleusercontent.com/sitesv/APaQ0ST_ZDf3nkDKBUlN9rqdY0NJ25ft6N8Zl3e-P-MR5-1zlR9olHDbrFt2XXbTZJ7qpJPVTOJ1Y9Zhf3AeUhoum0bCh2xmg_wvJSLXe4O79BkB1DdK6_PmCoru5SdI2xMT4hhA2Z2MvYfJ0nX6C2f3Pfw9yU_o-cGIPaSlzTNEdExkXe3SOwcu4ED2=w16383",
    "nomenclature": "30cm-10"
  },
  {
    "url": "https://lh3.googleusercontent.com/sitesv/APaQ0ST_QPienACANFxW_vVGKJUhbAwSO6x7gRBeiS53JtUD6j3YJijsdSp5_ae5B72lRqFh351pMx-nfSJhfJX2a2EStc3E1aA0GZdXLdjNFFBD6fZt6HgxN4_f6uRHkXbrQcqzDF1OuFDkAlmLbYt4DM2hNUoV7vyK58VaqiUTVxumCXu050RAQxNTCFwgi_QXYfjEvNLVHdT039smczIixENWTxf8yo6k5tml7E4=w1280",
    "nomenclature": "30cm-11"
  }
];

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                try { fs.unlinkSync(filepath); } catch(e) {}
                downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => { file.close(resolve); });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

async function main() {
    console.log(`Starting download for ${decals.length} images...`);
    for (const decal of decals) {
        const filepath = path.join(OUTPUT_DIR, `${decal.nomenclature}.jpg`);
        try {
            process.stdout.write(`Downloading ${decal.nomenclature}.jpg... `);
            await downloadFile(decal.url, filepath);
            console.log('OK');
        } catch (err) {
            console.log(`FAILED: ${err.message}`);
        }
    }
    console.log('Done!');
}

main();
