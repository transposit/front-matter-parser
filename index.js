const fm = require('front-matter');
const CryptoJS = require("crypto-js");

exports.handler = async function (event, context, callback) {
  var content = JSON.parse(event.body).content;
  var parsedStr;
  if (event.queryStringParameters && event.queryStringParameters.base64 === 'false') {
    parsedStr = content;
  } else {
    var parsedWordArray = CryptoJS.enc.Base64.parse(content.replace(/\n/g,""));
    parsedStr = parsedWordArray.toString(CryptoJS.enc.Utf8);
  }

  callback(null, {
    "isBase64Encoded": false,
    "statusCode": 200,
    "body": JSON.stringify(fm(parsedStr))
  });
}
