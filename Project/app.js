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
    $('#controlsView').show();
}

app.showStart = function()
{
    $('#disconnect').prop('disabled', true);
    $('#startView').show();
    $('#controlsView').hide();
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
    navigator.vibrate(1000);
    app.showStart();
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
        device.connect(connectSuccess,connectFailure); //device.connect(successFunc, failFunc)
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
    navigator.vibrate(250);
    app.connected = true;
    app.device = device; 
    app.device.readServices(serviceSuccess, serviceFailure, [app.SERVICE_UUID]);
}


/*      No functionality:
    Tells user the device failed to connect.
*/
function connectFailure()
{
    app.disconnect('Failed to connect!');
    //app.connected = false;
    //console.log('Failed to connect! :( ');
    //navigator.vibrate(1000);
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
    app.showControls();
    //showControls();
}


/*      Functionality:
    Could not allow connection to bluetooth device.
    Disconnects device from server.
*/
function serviceFailure(errorCode){
    //console.log("Failed to read services" + errorCode);
    app.disconnect('Failed to read services' + errorCode); //disconnect from device
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
                console.log("Succeeded to send a message! " + data);
            },
            function(errorCode){
                console.log("Failed to send a message! " + errorCode);
            }
        );
    }
    else {
        app.disconnect("Device disconnected when trying to send message");
    }
}


/*      Functionality:
    Feedback we receive from the arduino to confirm that it received our sent data.
*/
app.receivedData = function(data){
    console.log("Data received from the Arduino: " + data[0]);

    //navigator.vibrate(1000);
    if(data[0] == 0x31){ // 1 in hexadecimal
        // vibrate phone
        navigator.vibrate(800); 
    }
    else if (data === '2') { // 
        // do stuff
    }
}

app.cancelInput = function() {
    app.sendData([0]);
    console.log('Cancelled motor input !');
}

app.increment = function(data) { // data is the name of the motor to move
    if (data == "serv1") {
        app.sendData([5]);
        console.log('Incrementing servo 1 !');
    }
    else if (data == "serv2") {
        app.sendData([7]);
        console.log('Incrementing servo 2 !');
    }
    else if (data == "serv3") {
        app.sendData([9]);
        console.log('Incrementing servo 3 !');
    }
    else if (data == "serv4") {
        app.sendData([11]);
        console.log('Incrementing servo 4 !');
    }
    else if (data == "step1") {       // if stepper 1 is called
        app.sendData([1]);          // send appropriate data to arduino
        console.log('Incrementing stepper 1 !');
    }
    else if (data == "step2") {
        app.sendData([3]);
        console.log('Incrementing stepper 1 !');
    }
}

app.fastIncrement = function(data) { // data is the name of the motor to move
    if (data == "serv1") {
        app.sendData([13]);
    }
    else if (data == "serv2") {
        app.sendData([15]);
    }
    else if (data == "serv3") {
        app.sendData([17]);
    }
    else if (data == "serv4") {
        app.sendData([19]);
    }
    else if (data == "step1") {       // if stepper 1 is called
        app.sendData([21]);          // send appropriate data to arduino
    }
    else if (data == "step2") {       // stepper 2
        app.sendData([23]);
    }
}


app.decrement = function(data) {   // data is the name of the motor to move
    if (data == "serv1") {           // servo 1 backwards
        app.sendData([6]);
        console.log('Decrementing servo 1 !');
    }
    else if (data == "serv2") {     // servo 2 backwards
        app.sendData([8]);
        console.log('Decrementing servo 2 !');
    }
    else if (data == "serv3") {
        app.sendData([10]);
        console.log('Decrementing servo 3 !');
    }
    else if (data == "serv4") {
        app.sendData([12]);
        console.log('Decrementing servo 4 !');
    }
    else if (data == "step1") {     // stepper 1 backwards
        app.sendData([2]);
        console.log('Decrementing stepper 1 !');
    }
    else if (data == "step2") {     // stepper 2 backwards
        app.sendData([4]);
        console.log('Decrementing stepper 2 !');
    }
}

app.fastDecrement = function(data) {   // data is the name of the motor to move
    if (data == "serv1") {           // servo 1 backwards
        app.sendData([14]);
    }
    else if (data == "serv2") {     // servo 2 backwards
        app.sendData([16]);
    }
    else if (data == "serv3") {
        app.sendData([18]);
    }
    else if (data == "serv4") {
        app.sendData([20]);
    }
    else if (data == "step1") {     // stepper 1 backwards
        app.sendData([22]);
    }
    else if (data == "step2") {     // stepper 2 backwards
        app.sendData([24]);
    }
}