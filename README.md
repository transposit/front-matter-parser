## How to deploy:

```
npm install; zip -r ../front-matter-parser.zip *
AWS_PROFILE=tina-sandbox-lambda aws lambda update-function-code --function-name front-matter-parser --zip-file fileb://../front-matter-parser.zip
```
