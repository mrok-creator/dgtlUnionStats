const express = require('express')
const router = express.Router()

const {controlWrapper} = require('../../helpers')
const ctrl = require('../controller/ctr');

router.get('/dailyStats', controlWrapper(ctrl.ctrDailyStats));

router.get('/periodStats', controlWrapper(ctrl.ctrPeriodStats));



module.exports = router
