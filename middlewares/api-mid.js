const Ut = require('../utils/utils');
const { validationResult } = require('express-validator');
const setApiContentType = (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    next();
}

const validateApi = (req, res, next) => {
    const result = validationResult(req);
    const errors = result.array();
    if(Ut.isArray(errors) && errors.length > 0) {
        res.json({'msg': "Invalid parameters", "errors": errors})
    }
    else{
        next();
    }
    
}

exports.setApiContentType = setApiContentType
exports.validateApi = validateApi