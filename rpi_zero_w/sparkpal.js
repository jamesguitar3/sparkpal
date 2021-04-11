const i2c = require('i2c-bus');
const oled = require('oled-i2c-bus');
const font = require('oled-font-5x7');
const gpio = require('rpi-gpio');
const bluetooth = require('node-bluetooth');
const debounce = require('debounce');
const fs = require("fs");
const Spark = require("./spkHelper");
const configFilePath = "./config.json";
const pause = (ms) => new Promise(res => setTimeout(res, ms));
//Oled display definion
const oledOpts = { width: 128, height: 64, address: 0x3C};
//GPIO physical pin
const presetUp = 11;
const presetDown = 13;;
const driveToggle = 33;
const modToggle = 35;
const delayToggle = 37;
const driveLED = 36;
const modLED = 38;
const delayLED = 40;
//GPIO listener
gpio.setup(presetUp, gpio.DIR_IN, gpio.EDGE_BOTH);
gpio.setup(presetDown, gpio.DIR_IN, gpio.EDGE_BOTH);
gpio.setup(driveToggle, gpio.DIR_IN, gpio.EDGE_BOTH);
gpio.setup(modToggle, gpio.DIR_IN, gpio.EDGE_BOTH);
gpio.setup(delayToggle, gpio.DIR_IN, gpio.EDGE_BOTH);
gpio.setup(driveLED, gpio.DIR_OUT);
gpio.setup(modLED, gpio.DIR_OUT);
gpio.setup(delayLED, gpio.DIR_OUT);

let config = {};
let version = 0.1;
let i2cBus = i2c.openSync(1);    
let display = new oled(i2cBus, oledOpts);  
let sparkConnection;  
let activePreset;
let fxStatus = {};

const device = new bluetooth.DeviceINQ();
const exitHandler = () => {
    console.log(`User stopped.`);    
    if(sparkConnection) sparkConnection.close();
    display.turnOffDisplay(); 
    gpio.write(driveLED, false);    
    gpio.write(modLED, false);    
    gpio.write(delayLED, false);   
    gpio.reset();
    gpio.destroy();
    process.exit();
};
//Config file handler
const readConfigFile = () =>{
    if (fs.existsSync(configFilePath)){
        try{
            let fileRawData = fs.readFileSync(configFilePath);        
            config = JSON.parse(fileRawData);
        }
        catch(err){
            //TODO show error/steps on oled
        }
    }    
};
const writeConfigFile = () => {
    fs.writeFileSync(configFilePath, JSON.stringify(config));
};
//Oled message display
const displayMessage = (message, size=1) => {
    display.clearDisplay(); 
    display.setCursor(1, 1);
    display.writeString(font, size, message, 1, true);
};
const pairSparkBTDevice = () => {
    console.log('pairing...');
    displayMessage("pairing...");  
    if(config && config.sparkBTConn && config.sparkBTConn.address && config.sparkBTConn.channel){
        console.log("Connect Spark using the stored address & ch info.")
        try{
            connectSparkBT(config.sparkBTConn.address, config.sparkBTConn.channel);       
        }
        catch(err){
            console.error(err);
            displayMessage("Failed to connet Spark.");    
            //TODO fall back to scan?    
        }
    }   
    else{
        device.on('found', (address, name)=>{
            console.log('Found: ' + address + ' with name ' + name);    
            if (name.indexOf("Spark") >= 0){
                try{
                    device.findSerialPortChannel(address, (channel)=>{                        
                        connectSparkBT(address, channel, true);
                    }); 
                }       
                catch(err){
                    console.error(err);
                    displayMessage("Failed to connet Spark.");        
                }
            }     
        });
        device.scan();        
    }       
};

const connectSparkBT = (address, channel, updateCofigFile=false) =>{
    bluetooth.connect(address, channel, async (err, connection)=>{      
        if(err)
            console.error(err);
        else{
            //Save the connection info to the config file for future connection
            if (updateCofigFile){
                config.sparkBTConn = {address, channel};
                writeConfigFile();
            }                
            sparkConnection = connection;
            //Setup up the data listner
            let receivedPresetData;
            sparkConnection.on("data", (buffer) => {            
                let data = buffer.toString("hex");                             
                if (data.indexOf(Spark.dataPrefix.fxStatusChange) === 0){                
                    console.log(`Fx status is changed`);                
                    //TODO change the fx led to be reactive based on the mssage here?                
                }
                else if(data.indexOf(Spark.dataPrefix.presetChanged) === 0){
                    //TODO verify if the preset is changed to the desired preste and retry if not
                }
                else if(data.indexOf(Spark.dataPrefix.presetData) === 0){
                    receivedPresetData += data;  
                    //Gather all the messges and parse only the lest message is received.
                    if(Spark.isLastPresetDataMessage(data)){                        
                        fxStatus = Spark.parsePresetData(receivedPresetData);                    
                        receivedPresetData = null;
                        console.log(fxStatus);
                        if(fxStatus && fxStatus.drive)
                            gpio.write(driveLED, fxStatus.drive.enabled);                        
                        if(fxStatus && fxStatus.mod)                            
                            gpio.write(modLED, fxStatus.mod.enabled);                        
                        if(fxStatus && fxStatus.delay)                                                    
                            gpio.write(delayLED, fxStatus.delay.enabled);                        
                    }                  
                }
                else if(data.indexOf(Spark.dataPrefix.currentPreset) === 0){                             
                    activePreset = parseInt(data.substr(Spark.dataPrefix.currentPreset.length, 1)) + 1;
                    console.log(`active preset ${activePreset}`);
                    displayMessage(activePreset.toString(), 4);
                }
            });               
            console.log("connected");
            displayMessage("Spark is connected");
            console.log("Request for the current preset number")
            sparkConnection.write(Buffer.from(Spark.command.preset.current, "hex"),()=>{ });            
            console.log("Request for the current preset data");
            sparkConnection.write(Buffer.from(Spark.command.preset.currentData, "hex"),()=>{ });
        }
    });
};

device.on('finished',  ()=>{
    console.log("Scan finished");   
});

const toggleFXStatus = (fxType) => {
    if(fxStatus && fxStatus[fxType] && sparkConnection){
        let cmd = fxStatus[fxType].enabled === true ? Spark.command.fx[fxType][fxStatus[fxType].id].off : Spark.command.fx[fxType][fxStatus[fxType].id].on;
        let LEDPin;
        switch (fxType){
            case "drive":
                LEDPin = driveLED;
                break;
            case "mod":
                LEDPin = modLED;
                break;
            case "delay":
                LEDPin = delayLED;
                break;
            default:
                LEDPin = driveLED;
                break;
        }
        console.log(`Sent fx command: ${cmd}`);
        sparkConnection.write(Buffer.from(cmd, "hex"),()=>{ 
            fxStatus[fxType].enabled = !fxStatus[fxType].enabled;                 
            gpio.write(LEDPin, fxStatus[fxType].enabled);
            console.log(`Sent ${fxType}: ${fxStatus[fxType].enabled }`);       
        });
    }
};

const switchPreset = (direction) => {
    if(direction === "up")
        activePreset = activePreset === 4 ? 1 : activePreset + 1;
    else if (direction === "down")
        activePreset = activePreset === 1 ? 4 : activePreset - 1;
    if (sparkConnection){
        console.log(`Change to Preset ${activePreset}`);            
        sparkConnection.write(Buffer.from(Spark.command.preset[`set${activePreset}`], "hex"), async ()=>{ 
            displayMessage(activePreset.toString(), 4);   
            // await pause(200);         
            console.log("Request for the current preset data");
            sparkConnection.write(Buffer.from(Spark.command.preset.currentData, "hex"), ()=>{});
        });        
    }
};

gpio.on('change', (ch, value)=>{        
    if (value === true){                              
        switch(ch){
            case presetUp:
                debounce(switchPreset("up"), 10, true);    
                break;
            case presetDown:
                debounce(switchPreset("down"), 10, true);    
                break;            
            case driveToggle:
                debounce(toggleFXStatus("drive"), 10, true);                
                break;
            case modToggle:
                debounce(toggleFXStatus("mod"), 10, true);
                break;
            case delayToggle:
                debounce(toggleFXStatus("delay"), 10, true);
                break;
        }     
    }
});

process.on('SIGINT', exitHandler); //function to run when user closes using ctrl+c

const init = () => {
    display.turnOnDisplay();
    displayMessage(`Welcome to SparkPal v${version}`);
    readConfigFile();
    pairSparkBTDevice();
}

//Main
(()=>{
    init();   
})();










  