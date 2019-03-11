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

function sync(service, event) {
  var name = service.name;
  var maintainer = service.maintainer;
  // change the cwd to /tmp
  process.chdir('/tmp')
  // remove the dir if it's already in tmp
  const dest = `/tmp/${name}`;
  runCommand(`rm -rf ${dest}`)
  // clone the repository and set it as the cwd
  const gitRepositoryURL = `https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/transposit-connectors/${name}.git`
  runCommand(`git clone ${gitRepositoryURL}`)
  process.chdir(dest);

  var results = [];

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
    const envRepositoryURL = `https://${envUsername}:${envToken}@${envPrefix}.transposit.com/git/${maintainer}/${name}`;
    
    runCommand(`git remote add ${env} ${envRepositoryURL}`)
    console.log(`pushing ${name} to ${env}!`)

    var pushResult;
    var pushTagsResult;
    try {
      pushResult = runCommand(`git push ${env} master -f`);
      pushTagsResult = runCommand(`git push ${env} -f --tags`);
    } catch (err) {
      results.push(name + ": " + err);
      return;
    }

    if(pushResult !== "Everything up-to-date\n") {
      var nameToEnv = `${name} -> ${env}: `;
      results.push(nameToEnv + pushResult.split("\n").splice(2).join("\n"));
    }

    if(pushTagsResult !== "Everything up-to-date\n") {
      results.push(nameToEnv + pushTagsResult.split("\n").splice(2).join("\n"));
    }
  });

  console.log("results: " + results);
  return results;
}

exports.handler = async function (event, context, callback) {
  var allResults = [];
  // install git binary
  await require('lambda-git')()

  // Sample apps
  event.services && event.services.map(function(service) {
    var servicesResults = sync(service, event);
    allResults = allResults.concat(servicesResults);
  });
  
  // Global services
  event.names && event.names.map(function(name) {
    var service = {name: name, maintainer: "transposit"};
    var namesResults = sync(service, event);
    allResults = allResults.concat(namesResults);
  });

  callback(null, allResults);
}
