const {createError} = require( "../../../helpers");
const { countDailyCtr } = require('../../services/ctr');

const ctrDailyStats = async (req,res, next) => {
    const dateParam = req.query.day;

    if (!dateParam) {
        throw createError('Missing required parameter: day', 400);
    }

    const ctrResults = await countDailyCtr(dateParam);
    res.json( ctrResults);
}

module.exports = ctrDailyStats;