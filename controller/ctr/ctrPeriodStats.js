const fs = require('fs');
const path = require('path');

const { getFileDate, getDailyStats, isValidDate } = require('./ctrCalculations');
const {createError} = require('../../helpers')

const directoryPath = path.join(__dirname, '../../events');

const ctrPeriodStats = async (req,res,next) => {
    const {from, to} = req.query;

    if (!from || !to) {
        throw createError('Both "from" and "to" parameters are required.', 400);
    }

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

    const stats = await getDailyStats(arrFilesForPeriod, directoryPath);
    res.json(stats);
}

module.exports = ctrPeriodStats;