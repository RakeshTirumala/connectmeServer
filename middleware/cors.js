const express = require('express');

function CORS(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://connectme-three.vercel.app");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
}

module.exports = CORS;