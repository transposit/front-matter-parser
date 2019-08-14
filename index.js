const fm = require('front-matter');
const CryptoJS = require("crypto-js");

exports.handler = async function (event, context, callback) {
  var parsedWordArray = CryptoJS.enc.Base64.parse(event.content.replace(/\n/g,""));
  var parsedStr = parsedWordArray.toString(CryptoJS.enc.Utf8);

  callback(null, fm(parsedStr));
}
