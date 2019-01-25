const fs = require('fs')
const path = require('path')
const process = require('process')
const { spawnSync } = require('child_process')

const { GITHUB_TOKEN, GITHUB_USERNAME, DEMO_TOKEN, DEMO_USERNAME, API_TOKEN, API_USERNAME, STAGING_TOKEN, STAGING_USERNAME } = process.env

function runCommand (commandString, options) {
  const [command, ...args] = commandString.match(/(".*?")|(\S+)/g)
  const cmd = spawnSync(command, args, options)

  const errorString = cmd.stderr.toString()
  if (errorString) {
    console.log(errorString)
  }
  if (cmd.status != 0) {
    throw new Error("Unsuccessful cmd: " + commandString + "\n" + errorString);
  }
  return errorString;
}

exports.handler = async function (event, context, callback) {
  var results = [];
  // install git binary
  await require('lambda-git')()
  event.names.map(function(name) {
    // change the cwd to /tmp
    process.chdir('/tmp')
    // remove the dir if it's already in tmp
    const dest = `/tmp/${name}`;
    runCommand(`rm -rf ${dest}`)
    // clone the repository and set it as the cwd
    const gitRepositoryURL = `https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/transposit-connectors/${name}.git`
    runCommand(`git clone ${gitRepositoryURL}`)
    process.chdir(dest);

    event.env.map(function(env) {
      let envToken, envUsername;
      switch(env) {
        case "demo":
          envToken = DEMO_TOKEN;
          envUsername = DEMO_USERNAME;
        break;
        case "api":
          envToken = API_TOKEN;
          envUsername = API_USERNAME;
        break;
        case "staging":
          envToken = STAGING_TOKEN;
          envUsername = STAGING_USERNAME;
        break;
        default:
          throw new Error("env must be either demo, api, or staging");
      }
      
      const envPrefix = env === "api" ? "console" : `console.${env}`;
      const envRepositoryURL = `https://${envUsername}:${envToken}@${envPrefix}.transposit.com/git/transposit/${name}`;
      
      runCommand(`git remote add ${env} ${envRepositoryURL}`)
      console.log(`pushing ${name} to ${env}!`)
      var pushResult = runCommand(`git push ${env} master -f`);
      var pushTagsResult = runCommand(`git push ${env} -f --tags`);

      if(pushResult !== "Everything up-to-date\n") {
        results.push(pushResult.split("\n").splice(2).join("\n"))
      }

      if(pushResult !== "Everything up-to-date\n") {
        results.push(pushTagsResult.split("\n").splice(2).join("\n"))
      }

    });
  });

  callback(null, results)
}
