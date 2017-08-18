'use strict';

// Imports the Google APIs client library
const google = require('googleapis');

// Your Google Cloud Platform project ID
const projectId = 'isla-labs-1138';

// Lists keys in the "global" location.
const location = 'global';

// Name of the keyring with the accessToken key.
const gcfKeyRing = 'cloud-functions';

// Name of the key in the keyring.
const gcfKeyName = 'accessToken';

// Load encrypted commands from file
const commands = require('./commands.json');

// Cached decrypted commands.
var decryptedCache = {};

const exec = require('child_process').exec;

const decryptData = function(dataEnc, cb) {
    // Acquires credentials
    google.auth.getApplicationDefault((err, authClient) => {
        if (err) {
            console.error('Failed to acquire credentials');
            cb("Failed to acquire credentials", null);
            return;
        }

        if (authClient.createScopedRequired && authClient.createScopedRequired()) {
            authClient = authClient.createScoped([
                'https://www.googleapis.com/auth/cloud-platform'
            ]);
        }

        // Instantiates an authorized client
        const cloudkms = google.cloudkms({
            version: 'v1',
            auth: authClient
        });
        const request = {
            name: `projects/${projectId}/locations/${location}/keyRings/${gcfKeyRing}/cryptoKeys/${gcfKeyName}`,
            resource: {
                ciphertext: dataEnc
            }
        };

        cloudkms.projects.locations.keyRings.cryptoKeys.decrypt(request, (err, result) => {
            if (err) {
                console.log(err);
                cb(err, null);
                return;
            }

            const decrypted = Buffer.from(result.plaintext, 'base64');

            cb(null, decrypted);
        });
    });
}

exports.stFn1 = function (req, res) {
    if (req.body.token === undefined) {
        res.status(400).send('No token defined!');
        return
    }
    const tokenEnc = req.body.token;

    decryptData(tokenEnc, (err, token) => {
        if (err != null) {
            res.status(500).send("Internal error");
            return;
        }

        console.log(`Access token decrypted: '${token}'`);

        if (token != "stfn-access-token") {
            res.status(403).send("Unauthorized");
            return;
        }

        console.log("Access token is valid.");

        if (req.body.cmd === undefined) {
            // This is an error case, as "message" is required
            res.status(400).send('No cmd defined!');
        } else {
            const req_cmd = req.body.cmd.toLowerCase();
            var decrypt = true;
            var cmd = decryptedCache[req_cmd];

            if (cmd != undefined) {
                // Exec the command.

                console.log("Executing decrypted cmd");
                
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        res.status(500).send(`Unable to exec 'cmd': ${error}`);
                        return;
                    }

                    // command output is in stdout
                    console.log(`Command stdout: ${stdout}`);
                    console.log(`Command stderr: ${stderr}`);

                    res.status(200).send(stdout + stderr);
                });

                return;
            }

            const cmd_enc = req_cmd == "on" ? commands.on_cmd : commands.off_cmd;
            // Decrypt the command
            decryptData(cmd_enc, (err, cmd) => {
                if (err != null) {
                    res.status(400).send(`Unable to decrypt 'cmd': ${err}`);
                    return;
                }

                // Cache the decrypted command
                console.log("Caching decrypted command");
                decryptedCache[req_cmd] = cmd.toString();

                console.log("Executing decrypted cmd");

                // Exec the command.
                exec(cmd.toString(), (error, stdout, stderr) => {
                    if (error) {
                        res.status(500).send(`Unable to exec 'cmd': ${error}`);
                        return;
                    }

                    // command output is in stdout
                    console.log(`Command stdout: ${stdout}`);
                    console.log(`Command stderr: ${stderr}`);

                    res.status(200).send(stdout + stderr);
                });

            });
        }
    });
};