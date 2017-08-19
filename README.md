# Google Cloud Functions SamrtThings Integration

Clone the repository:

```
git clone https://github.com/danisla/smartthings-cloud-functions
cd smartthings-cloud-functions
```

## Google Cloud Function deployment

### Configure Cloud Functions

Change to the cloud_function directory

```
cd cloud_function
```

Login to the gcloud SDK:

```
gcloud init
```

Enable the Cloud Functions and KMS APIs

```
gcloud service-management enable cloudfunctions.googleapis.com
gcloud service-management enable cloudkms.googleapis.com
```

Grant the Cloud Functions service account permission to use the KMS decrypt action:

```
gcloud kms keys add-iam-policy-binding \
    accessToken --location global --keyring cloud-functions \
    --member serviceAccount:$(gcloud config get-value project)@appspot.gserviceaccount.com \
    --role roles/cloudkms.cryptoKeyDecrypter
```

Create the staging bucket:

```
gsutil mb gs://$(gcloud config get-value project)-cloud-functions
```

### Add the token to Cloud KMS

Create the `cloud-functions` keyring:

```
gcloud kms keyrings create cloud-functions --location global
```

Create the key:

```
gcloud kms keys create accessToken --purpose=encryption --location global --keyring cloud-functions
```

Encrypt the token:

```
TOKEN_ENC=$(echo -n "cmdexec-access-token" | ./encrypt_cmd.sh)
```

Test the decryption:

```
echo -n "${TOKEN_ENC}" | ./decrypt_cmd.sh
```

> The output should be `cmdexec-access-token`

Encrypt the on and off commands to execute:

```
ON_CMD_ENC=$(echo -n 'echo "Turning ON"' | ./encrypt_cmd.sh)
OFF_CMD_ENC=$(echo -n 'echo "Turning OFF"' | ./encrypt_cmd.sh)
```

Save the encrypted commands to the `commands.json` file read by the Cloud Function:

```
echo "{}" | jq '.on="'${ON_CMD_ENC}'" | .off="'${OFF_CMD_ENC}'"' > ./cloud_function/commands.json
```

### Deploy the Cloud Function

```
./deploy.sh
```

### Test Cloud Function Manually

```
GOOGLE_PROJECT=$(gcloud config get-value project)

curl -X POST -w "%{http_code}\n" https://us-central1-${GOOGLE_PROJECT}.cloudfunctions.net/cmdExec -H "Content-Type: application/json" -d '{"token": "'${TOKEN_ENC}'", "cmd": "on"}'

curl -X POST -w "%{http_code}\n" https://us-central1-${GOOGLE_PROJECT}.cloudfunctions.net/cmdExec -H "Content-Type: application/json" -d '{"token": "'${TOKEN_ENC}'", "cmd": "off"}'
```

### Viewing the Cloud Function Logs

To get logs for the function `cmdExec`:

```
gcloud beta functions logs read cmdExec
```

## SmartThings device type deployment

Create the device type handler in the SmartThings web UI:

1. Login to https://graph.api.smartthings.com/
2. Click "My Device Handlers"
3. Click "Create New Device Handler"
4. Click "From Code"
5. Copy and paste the contents of `device.groovy`
6. Click "Create"
7. Click "Publish" -> "For Me" buttons

Create a new device with the custom device type from the web UI:

1. Click "My Devices"
2. Click "New Device"
3. Enter a name
4. Set Device Network Id to any integer value, like `31337`.
5. From the Type dropdown, select "Cloud Function Exectuor"
6. From the Version drop down, select "Self-Published"
7. Select your Location and Hub from the drop downs.

Add the preferences to the new device:

1. Click the "edit" button next to "Preferences"
2. Enter the URL of the cloud function: `https://us-central1-${GOOGLE_PROJECT}.cloudfunctions.net/cmdExec` (replace `${GOOGLE_PROJECT}` with your project id.)
3. Enter the value `$TOKEN_ENC` into the "Encrypted access token" field.
4. Enter the names of the on and off commands.
5. Click "Save"

### Test the SmartThings device

Open the app and look for the new switch device you created.

Toggle the switch on/off and verify the cloud function is executed. 

Get the cloud function logs: 

```
gcloud beta functions logs read cmdExec
```

Get the SmartThings logs by clicking on the "Live Logging" link at the top of the web UI.

## Google Cloud Function local development

Install the functions-emulator globally:

```
npm install -g @google-cloud/functions-emulator
```

Install the package dependencies:

```
npm install
```

Authenticate with the application default credentials:

```
gcloud auth application-default login
```

Start the emulator:

```
functions start
```

Deploy the function to the emulator:

```
functions deploy cmdExec --trigger-http
```

Call the function:

```
functions call cmdExec --data '{"token": "'${TOKEN_ENC}'", "cmd": "on"}'
```
