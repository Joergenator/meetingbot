// Gmail API logic — to be implemented
const { google } = require("googleapis");
const { oauth2Client } = require("./auth");

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

module.exports = { gmail };
