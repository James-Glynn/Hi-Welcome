// Sets console.log() to print to Evothings console
if (window.hyper && window.hyper.log) { console.log = hyper.log }

document.addEventListener(
    'deviceready',
    function() { console.log('device ready!') });

var app = {
    connected : false,
    device : null,
    SERVICE_UUID : "",
    CHARACTERISTIC_UUID : "",
}
//Our device address is:
app.address = '4C:24:98:30:46:B8';

app.SERVICE_UUID='0000ffe0-0000-1000-8000-00805f9b34fb';
app.CHARACTERISTIC_UUID='0000ffe1-0000-1000-8000-00805f9b34fb';

app.showControls = function()
{
    $('#disconnect').prop('disabled', false);
    $('#startView').hide();
    $('#controlView').show();
}

app.showStart = function()
{
    $('#disconnect').prop('disabled', true);
    $('#startView').show();
    $('#controlView').hide();
}


//  BEGIN NEW CODE FOR ARDUINO FUNCTIONALITY
//

/* 
    No functionality:
    Tells user that app was initialized.
*/
app.initialize = function()
{
    console.log('Initialized');
    app.connected = false; 
    app.device = null;
}

/*      Functionality:
    Begins scan.
    Attempts to connect to the bluetooth module.
*/
app.connect = function() {
    console.log('Attempting to connect to bluetooth module');
    
    evothings.easyble.startScan(scanSuccess,scanFailure, {serviceUUIDS : [app.SERVICE_UUID]}, { allowDuplicates: false});
}


 /*     Functionality:
    Scan is stopped.
    Disconnects from device.
    Should be called when device is manually disconnected.
 */
app.disconnect = function(errorMessage) {
    if(errorMessage)
    {
        console.log(errorMessage);
    }
    app.connected = false;
    app.device = null;

    evothings.easyble.stopScan();
    evothings.easyble.closeConnectedDevices();
}


/*      Functionality:
    Tells user that a device was found and attempts to connect.
    Stops scan.
*/    
function scanSuccess(device)
{
    console.log('Scan successful: Found ' + device.name + " " + device.address);
    if(device.name != null && app.address == device.address)
    {
        console.log('Scan successful: Found' + device.name);
        device.connect(connectSuccess,connectFailure);
        //device.connect(successFunc, failFunc)
        evothings.easyble.stopScan();
    }
}


/*      No functionality:
    Tells user that the scan was not successful.
*/
function scanFailure(errorCode) {
    console.log('Scan failed: Error ' + errorCode);
}


/*      Functionality:
    Tells user that device was successfully connected to.
    Attempts to read in device details/UUID.
*/
function connectSuccess(device)
{
    console.log('Successfully connected!!');
    app.connected = true;
    app.device = device; 
    app.device.readServices(serviceSuccess, serviceFailure, [app.SERVICE_UUID]);

}


/*      No functionality:
    Tells user the device failed to connect.
*/
function connectFailure()
{
    app.connected = false;
    console.log('Failed to connect! :( ');
}


/*      Functionality:
    Allows the bluetooth module to accept inputs.
*/
function serviceSuccess(device)
{
    console.log('The bluetooth module can now read and write');
    app.device.enableNotification(
        app.SERVICE_UUID,
        app.CHARACTERISTIC_UUID,
        app.receivedData,
        function(errorCode)
        {
            console.log('Failed to receive notification from device' + errorCode);
        },
        { writeConfigDescriptor: false }
    );
}


/*      Functionality:
    Could not allow connection to bluetooth device.
    Disconnects device from server.
*/
function serviceFailure(errorCode){
    console.log("Failed to read services" + errorCode);
    app.disconnect(); //disconnect from device
}


/*      Functionality:
    Sends input to the arduino to interpret.
*/
app.sendData = function(data){
    if (app.connected && app.device != null) {
        data = new Uint8Array(data); // converts data to 8 bit integer array
        app.device.writeCharacteristic(
            app.CHARACTERISTIC_UUID,
            data,
            function(){
                console.log("Succeeded to send a message!" + data);
            },
            function(errorCode){
                console.log("Failed to send a message!" + errorCode);
            }
        );
    }
    else {
        app.disconnect("Device disconnected when trying to send message");
    }
}


/*      Functionality:
    Feedback we receive from the arduino.
*/
app.receivedData = function(data){
    if(data === '1'){ // connected to the arduino
        // vibrate phone
    }
    else if (data === '2') { // Our bluetooth module is found
        // do stuff
    }
}