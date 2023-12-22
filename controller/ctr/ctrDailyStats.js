const fs = require('fs');
const path = require('path');
const directoryPath = path.join(__dirname, '../../events');

const {createError} = require( "../../helpers");
const { getAllDataForDay, calculateCTR } = require('./ctrCalculations');
const ctrDailyStats = async (req,res,next) => {
    console.log(directoryPath)
    const dateParam = req.query.day;

    if (!dateParam) {
        throw createError('Missing required parameter: day', 400);
    }

    const arrDataForDay = [];
    fs.readdir(directoryPath, async (err, files) => {
        if (err) {
            console.error('Directory read error:', err);
            return;
        }

        const arrFilesForDate = files.filter(file => file.startsWith(`sessions_${dateParam}_`));
        for (const oneFile of arrFilesForDate) {
            const filePath = `${directoryPath}/${oneFile}`
            arrDataForDay.push(await getAllDataForDay(filePath));
        }
        const flattenedArray = [].concat(...arrDataForDay);
        const ctrResults = calculateCTR(flattenedArray);
        res.json( ctrResults);
    });
}

module.exports = ctrDailyStats;