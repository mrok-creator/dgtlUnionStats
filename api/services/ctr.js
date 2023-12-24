const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const {createError} = require("../../helpers");

const directoryPath = path.join(__dirname, '../../events');

async function countDailyCtr(dateParam) {
    const arrDataForDay = [];

    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, async (err, files) => {
            if (err) {
                console.error('Directory read error:', err);
                reject(err);
                return;
            }

            const arrFilesForDate = files.filter(file => file.startsWith(`sessions_${dateParam}_`));
            for (const oneFile of arrFilesForDate) {
                const filePath = `${directoryPath}/${oneFile}`
                arrDataForDay.push(await getAllDataForDay(filePath));
            }

            const flattenedArray = [].concat(...arrDataForDay);
            resolve(calculateCTR(flattenedArray));
        });
    });
}

async function countPeriodCtrStats(from, to) {
    const startDate = new Date(from);
    const endDate = new Date(to);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || !isValidDate(from) || !isValidDate(to)) {
        throw createError('Invalid date format. Please use YYYY-MM-DD.', 400);
    }

    const files = await fs.promises.readdir(directoryPath);

    const arrFilesForPeriod = files.filter(file => {
        const fileDate = getFileDate(file);
        return fileDate >= startDate && fileDate <= endDate;
    });

    return getDailyStats(arrFilesForPeriod, directoryPath);
}

async function getAllDataForDay(filePath) {
    try {
        const dataFromCsv = [];
        const stream = fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                dataFromCsv.push(data);
            })
            .on('end', () => {});

        await new Promise((resolve, reject) => {
            stream.on('close', resolve);
            stream.on('error', reject);
        });

        return dataFromCsv;
    } catch (error) {
        console.error('File read error:', error.message);
        throw error;
    }
}

function calculateCTR(data) {
    try {
        const campaignData = {};

        data.forEach((entry) => {
            const campaign = entry.campaign;
            const session = entry.session;
            const adClicks = parseInt(entry.ad_click, 10) || 0;

            if (!campaignData[campaign]) {
                campaignData[campaign] = { uniqueSessions: new Set(), adClicks: 0 };
            }

            if (session) {
                campaignData[campaign].uniqueSessions.add(session);
            }

            campaignData[campaign].adClicks += adClicks;
        });

        // Converting Set to an array
        Object.values(campaignData).forEach((campaign) => {
            campaign.uniqueSessions = Array.from(campaign.uniqueSessions);
        });

        return Object.entries(campaignData).map(([campaign, { uniqueSessions, adClicks }]) => {
            const numberOfUniqueSessions = uniqueSessions.length;
            const ctr = numberOfUniqueSessions > 0 ? (adClicks / numberOfUniqueSessions) * 100 : 0;
            return {
                campaign: campaign,
                ctr: ctr.toFixed(2),
            };
        });
    } catch (error) {
        console.error('Error in CTR calculation:', error.message);
        throw error;
    }
}

async function getDailyStats(files, directoryPath) {
    const stats = [];

    try {
        // Grouping data by days
        const groupedData = {};

        for (const oneFile of files) {
            const filePath = `${directoryPath}/${oneFile}`;
            const fileData = await getAllDataForDay(filePath);

            // get date in "YYYY-MM-DD"
            const date = getFileDate(oneFile).toISOString().split('T')[0];

            if (!groupedData[date]) {
                groupedData[date] = [];
            }

            groupedData[date] = groupedData[date].concat(fileData);
        }

        // Calculating statistics for each day
        for (const date in groupedData) {
            const clicks = groupedData[date].reduce((acc, entry) => acc + parseInt(entry.ad_click, 10) || 0, 0);
            const views = groupedData[date].reduce((acc, entry) => acc + parseInt(entry.view, 10) || 0, 0);
            const uniqueSessions = [...new Set(groupedData[date].map((entry) => entry.session))].length;

            stats.push({
                date: date,
                clicks: clicks,
                views: views,
                uniqueSessions: uniqueSessions,
            });
        }

        return stats;
    } catch (error) {
        console.error('Error when retrieving statistics for the day:', error.message);
        throw error;
    }
}

function getFileDate(fileName) {
    const dateStr = fileName.match(/(\d{4}-\d{2}-\d{2})/);
    return dateStr ? new Date(dateStr[0] + 'T00:00:00Z') : null;
}

function isValidDate(dateString) {
    // Check that the length of the date string corresponds to the format YYYYY-MM-DD
    return dateString.length === 'YYYY-MM-DD'.length;
}

module.exports = {
    countDailyCtr,
    countPeriodCtrStats,
};
