const { countPeriodCtrStats } = require('../../services/ctr');
const {createError} = require('../../../helpers')

const ctrPeriodStats = async (req,res,next) => {
    const {from, to} = req.query;

    if (!from || !to) {
        throw createError('Both "from" and "to" parameters are required.', 400);
    }

    const ctrResults = await countPeriodCtrStats(from, to);
    res.json(ctrResults);
}

module.exports = ctrPeriodStats;