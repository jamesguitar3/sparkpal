#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h> //https://github.com/adafruit/Adafruit_SSD1306
#include "BluetoothSerial.h" // https://github.com/espressif/arduino-esp32
#include "sparkCMDs.h"
#include <BfButton.h> //https://github.com/mickey9801/ButtonFever
#include <Regexp.h>

// Device Info Definitions
const String DEVICE_NAME = "SparkPal";
const String VERSION = "0.3.1";

// GPIO Buttons/LEDs
#define BUTTON_PRESET_UP_GPIO 26
#define BUTTON_PRESET_DOWN_GPIO 25
#define BUTTON_DRIVE_GPIO 19
#define BUTTON_MOD_GPIO 18
#define BUTTON_DELAY_GPIO 32

#define LED_DRIVE_GPIO 13
#define LED_MOD_GPIO 12
#define LED_DELAY_GPIO 14

BfButton btn_drive(BfButton::STANDALONE_DIGITAL, BUTTON_DRIVE_GPIO, false, HIGH);
BfButton btn_mod(BfButton::STANDALONE_DIGITAL, BUTTON_MOD_GPIO, false, HIGH);
BfButton btn_delay(BfButton::STANDALONE_DIGITAL, BUTTON_DELAY_GPIO, false, HIGH);
BfButton btn_preset_up(BfButton::STANDALONE_DIGITAL, BUTTON_PRESET_UP_GPIO, false, HIGH);
BfButton btn_preset_down(BfButton::STANDALONE_DIGITAL, BUTTON_PRESET_DOWN_GPIO, false, HIGH);

// OLED Screen config
#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
// Declaration for an SSD1306 display connected to I2C (SDA, SCL pins)
#define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ESP32 Bluetooth Serial Object
BluetoothSerial SerialBT;
// Regex Tester
MatchState ms;

// Variables
int selectedPreset;
bool isBTConnected;
bool isInitBoot;
byte incoming_byte;
byte recBTData[1024];
byte recBTDataTrimmed[1024]; // Trim the prefix cmd bytes from the received data
char asciiData[1024];       // Converted from the byte data to ASCII for FX parse
int recBTDataIndex = 0;
const int FX_DRIVE = 0;
const int FX_MOD = 1;
const int FX_DELAY = 2;
int fxSelected[3]; // 0-> Drive, 1-> Mod, 2-> Delay
int fxEnabled[3];

void displayMessage(String message, int fontSize){
  // Clear the buffer
  display.clearDisplay();  
  display.setTextSize(fontSize);
  display.setCursor(0,0);
  display.print(message);
  display.display(); // actually display all of the above
}

void initDisplay() {
  Serial.println("Init display");
  // SSD1306_SWITCHCAPVCC = generate display voltage from 3.3V internally
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { // Address 0x3D for 128x64
    Serial.println(F("SSD1306 allocation failed"));
    for(;;); // Don't proceed, loop forever
  }
  // Clear the buffer
  display.clearDisplay();  //Clear the buffer first so we don't see Adafruit splash
  display.display();
    
  display.setTextColor(SSD1306_WHITE);
  displayMessage("SparkPal v0.2", 2);
}

void btnPresetHandler(BfButton *btn, BfButton::press_pattern_t pattern) {
  if (pattern == BfButton::SINGLE_PRESS) {        
    int pressed_btn_gpio = btn->getID();    
    // Debug    
    Serial.println("");
    Serial.print("Button pressed: ");
    Serial.println(pressed_btn_gpio);    
    //Up preset
    if (pressed_btn_gpio == BUTTON_PRESET_UP_GPIO) {
      Serial.println("Preset up");
      if (selectedPreset >= 4) {
        selectedPreset = 1;
      }
      else {
        selectedPreset++;
      }      
    }
    //Down preset
    else if (pressed_btn_gpio == BUTTON_PRESET_DOWN_GPIO) {
      Serial.println("Preset down");
      if (selectedPreset <= 1) {
        selectedPreset = 4;
      }
      else {
        selectedPreset--;
      }      
    }
    // Send the preset command
    sendSetPresetCmd(PRESET_CMD_LIST[selectedPreset - 1]); // selectedPreset is 1-4, but the array is 0 based
    // Delay 50ms and then ask for the preset's data
    delay(50);
    Serial.println("Requst for current preset's data");
    SerialBT.write(GET_CURR_PRESET_DATA_CMD, 60);
  }
}

void btnFXHandler(BfButton *btn, BfButton::press_pattern_t pattern) {
  if (pattern == BfButton::SINGLE_PRESS) {
    int pressed_btn_gpio = btn->getID();        
    // Debug    
    Serial.println("");
    Serial.print("Button pressed: ");
    Serial.println(pressed_btn_gpio);        
    int fxType;
    int fxStatus;
    int LEDPin;
    if(pressed_btn_gpio == BUTTON_DRIVE_GPIO){
      fxType = 0;        
      LEDPin = LED_DRIVE_GPIO;
    }
    else if(pressed_btn_gpio == BUTTON_MOD_GPIO){
      fxType = 1;
      LEDPin = LED_MOD_GPIO;
    }
    else if(pressed_btn_gpio == BUTTON_DELAY_GPIO){
      fxType = 2;
      LEDPin = LED_DELAY_GPIO;
    }
    //Toggle fx status      
    fxStatus = fxEnabled[fxType];
    //New status
    if(fxStatus == 0){
      fxStatus = 1;
      digitalWrite (LEDPin, HIGH);
    }
    else{
      fxStatus = 0;
      digitalWrite (LEDPin, LOW);
    }
    //Upate variables
    fxEnabled[fxType]= fxStatus;  
    //Send fx on/off command
    sendFXOnOffCmd(fxType, fxStatus);   
  }
}

void sendSetPresetCmd(byte* setPresetCmd) {
  SerialBT.write(setPresetCmd, SET_PRESET_CMD_SIZE);  
  displayMessage(String(selectedPreset), 8);  
}

void sendFXOnOffCmd(int fxType, int fxNewStatus){
  char* fxTypeString;
  char* fxStatusString;
  // Debug info
  if(fxType == FX_DRIVE){ fxTypeString = "Drive";}
  else if(fxType == FX_MOD){ fxTypeString = "Mod";}
  else if(fxType == FX_DELAY){ fxTypeString = "Delay";}
  if(fxNewStatus == 0){ fxStatusString = "Off";}
  else if(fxNewStatus == 1){ fxStatusString = "On";}
  Serial.print("Send command to toggle ");
  Serial.print(fxTypeString);
  Serial.print(" ");
  Serial.println(fxStatusString);

  if(fxType == FX_DRIVE){ //Drive        
    if(fxNewStatus == 0){ //Off
      SerialBT.write(FX_DRIVE_OFF_CMD_LIST[fxSelected[fxType]], FX_DRIVE_CMD_SIZE_LIST[fxSelected[fxType]]);
    }
    else{ //On
      SerialBT.write(FX_DRIVE_ON_CMD_LIST[fxSelected[fxType]], FX_DRIVE_CMD_SIZE_LIST[fxSelected[fxType]]);
    } 
  }  
  else if(fxType == 1){ //Mod  
    if(fxNewStatus == 0){ //Off
      SerialBT.write(FX_MOD_OFF_CMD_LIST[fxSelected[fxType]], FX_MOD_CMD_SIZE_LIST[fxSelected[fxType]]);
    }
    else{ //On
      SerialBT.write(FX_MOD_ON_CMD_LIST[fxSelected[fxType]], FX_MOD_CMD_SIZE_LIST[fxSelected[fxType]]);
    }      
  }
  else if(fxType == 2){ //Delay
    if(fxNewStatus == 0){ //Off
      SerialBT.write(FX_DELAY_OFF_CMD_LIST[fxSelected[fxType]], FX_DELAY_CMD_SIZE_LIST[fxSelected[fxType]]);
    }
    else{ //On
      SerialBT.write(FX_DELAY_ON_CMD_LIST[fxSelected[fxType]], FX_DELAY_CMD_SIZE_LIST[fxSelected[fxType]]);
    }  
  }
}

void btnSetup() {
  // Setup the button event handler
  btn_drive.onPress(btnFXHandler);
  btn_mod.onPress(btnFXHandler);
  btn_delay.onPress(btnFXHandler);
  btn_preset_up.onPress(btnPresetHandler);
  btn_preset_down.onPress(btnPresetHandler);
}

void btEventCallback(esp_spp_cb_event_t event, esp_spp_cb_param_t *param) {
  // On BT connection close
  if (event == ESP_SPP_CLOSE_EVT ) {    
    isBTConnected = false;
    selectedPreset = 0;
  }
}

void initBT() {
  // Register BT event callback method
  SerialBT.register_callback(btEventCallback);
  if (!SerialBT.begin(DEVICE_NAME, true)) { // Detect for BT failure on ESP32 chip
    displayMessage("BT init failed", 1);
    Serial.println("BT Init Failed!");
    // Loop infinitely until device shutdown/restart
    while (true) {};
  }
}

void connectToAmp() {
  // Loop until device establishes connection with amp
  while (!isBTConnected) {
    displayMessage("Connecting", 2);
    Serial.println("Connecting");
    isBTConnected = SerialBT.connect(SPARK_BT_NAME);    
    if (isBTConnected && SerialBT.hasClient()) {
      // Success
      displayMessage("Connected",2);
      // Delay a sec to show the Connected message on the screen
      delay(1000);
      //Get the current selected preset number
      Serial.println("Asking for current selected preset");
      SerialBT.write(GET_CURR_PRESET_CMD, 24);
      // delay(100); 
      // // Display inital Tone Preset Screen
      // displayMessage((String)selectedPreset, 8);      
    } else { 
      // Failed. Retry the connection.
      isBTConnected = false;
      displayMessage("Reconnect",2);        
      Serial.println("Reconnect");
      delay(1000);
    }
  }
}

void convertPresetDataBytesToASCII() {
  int data_size = sizeof recBTDataTrimmed / sizeof recBTDataTrimmed[0];
  for (int i = 0; i < data_size; i++) {
    asciiData[i] = (char) recBTDataTrimmed[i];
    //Replace 0x00 with '&' since 0x00 is the null terminator
    if (recBTDataTrimmed[i] == 0x00) {
      asciiData[i] = (char) 0x26;
    }
    else {
      asciiData[i] = (char) recBTDataTrimmed[i];
    }
  }
}

void parseASCIIToFXStats() {
  char result;
  ms.Target(asciiData);
  // Serial.print(asciiData);
  char* fxTypeString;
  int totalPedalCount = 0;
  int LEDPin;
  for (int fxType = 0; fxType < 3; fxType++) {
    if (fxType == 0) { //Drive
      fxTypeString = "Drive";
      totalPedalCount = 9;
      LEDPin = LED_DRIVE_GPIO;
    }
    else if (fxType == 1) { //Mod
      fxTypeString = "Mod";
      totalPedalCount = 10;
      LEDPin = LED_MOD_GPIO;
    }
    else if (fxType == 2) { //Delay
      fxTypeString = "Delay";
      totalPedalCount = 6;
      LEDPin = LED_DELAY_GPIO;
    }
    //Reset the curent fx status
    fxSelected[fxType] = -1;
    fxEnabled[fxType] = 0;

    Serial.println("-- FX status--");
    //Loop through each different possible pedal name regexp match
    for (int i = 0; i < totalPedalCount; i++) {
      if (fxType == FX_DRIVE) { //Drive
        result = ms.Match(exp_drive[i]);
      }
      else if (fxType == FX_MOD) { //Mod
        result = ms.Match(exp_mod[i]);
      }
      else if (fxType == FX_DELAY) { //Delay
        result = ms.Match(exp_delay[i]);
      }
      if (result == REGEXP_MATCHED) {
        fxSelected[fxType] = i;
        // Serial.println(ms.MatchStart);
        // Serial.println(ms.MatchLength);

        //In case there's unexpected char between the effect name and status 
        byte fxStatus;
        for (int a = 0; a < 13; a++){
          if (fxStatus != 0x43 && fxStatus != 0x42) {
            fxStatus = recBTDataTrimmed[ms.MatchStart + ms.MatchLength + a];  
          }  
          else{
            break;
          }
        }
        //Serial.println(fxStatus, HEX);  // enabled/disabled
        if (fxStatus == 0x43) {
          fxEnabled[fxType] = 1;
          digitalWrite (LEDPin, HIGH);
        }
        else if (fxStatus == 0x42) {
          fxEnabled[fxType] = 0;
          digitalWrite (LEDPin, LOW);
        }
        else {
          Serial.println("Neither 0x43 nor 0x42!!!!!!!!!!!!!!!!!!!!!");          
        }
        Serial.print(fxTypeString);
        Serial.print(" matched --- Pedal Num: ");
        Serial.print(fxSelected[fxType]);
        Serial.print(", Status: ");
        Serial.println(fxEnabled[fxType]);
        //Exit the looop
        break;
      }   
    }
    if (fxSelected[fxType] == -1){
      Serial.print("Oops... FX - ");
      Serial.print(fxTypeString);
      Serial.println(" is not matched");
    }
  }
}

void updateSelectedPreset(byte selectedPresetByte) {
  if (selectedPresetByte == 0x00) {
    selectedPreset = 1;
  }
  else if (selectedPresetByte == 0x01) {
    selectedPreset = 2;
  }
  else if (selectedPresetByte == 0x02) {
    selectedPreset = 3;
  }
  else if (selectedPresetByte == 0x03) {
    selectedPreset = 4;
  }
  displayMessage((String)selectedPreset, 8);
  Serial.print("Current Preset is ");
  Serial.println(selectedPreset);
}


void processRecBTData(const byte inByte) {
  //Gathering the received byte
  recBTData[recBTDataIndex] = inByte;
  recBTDataIndex++;
  int j = 0;

  //End of the incoming BT data and the last data is the ending char F7
  if ( !SerialBT.available() && inByte == (char)0xF7) {
    Serial.println(" ");
    Serial.print("Total data length: ");
    Serial.println(recBTDataIndex);

    //Only process the preset data if it is long enough (detailed preset data) (300 is an arbitrary number)
    //TODO check the prefix of the response type
    if (recBTDataIndex > 300) {
      //Serial.println("Trimming the block/CMD control bytes");
      for (int i = 0; i < recBTDataIndex; i++) {
        //Serial.print(recBTData[i], HEX);
        if (recBTData[i] == 0xF0 && recBTData[i + 1] == 0x01) {
          i = i + 9;
          //Serial.println("trimmed block start");
        }
        else if (recBTData[i] == 0x01 && recBTData[i + 1] == 0xFE && recBTData[i + 2] == 0x00 && recBTData[i + 3] == 0x00 && recBTData[i + 4] == 0x41) {
          i = i + 15;
          //Serial.println("trimmed cmd start");
        }
        else if ( recBTData[i] == 0xf7) {
          //Serial.println("trimmed block ending");
        }
        else {
          recBTDataTrimmed[j] = recBTData[i];
          //Debug
          //Serial.print(" ");
          //if (recBTDataTrimmed[i] < 15){
          //Serial.print(0);
          //}
          //Serial.print(recBTDataTrimmed[j], HEX);
          j = j + 1;
        }
      }
      //Convert the trimmed data to ASCII
      convertPresetDataBytesToASCII();
      Serial.println(asciiData);

      //Check ecah FX pedal's status
      parseASCIIToFXStats();
    }
    else {
      //Received the current selected preset response
      if (recBTDataIndex == 26 && recBTData[0] == 0x01 && recBTData[1] == 0xFE && recBTData[4] == 0x41 && recBTData[5] == 0xFF && recBTData[6] == 0x1A && recBTData[16] == 0xF0 && recBTData[17] == 0x01 && recBTData[18] == 0x08) {
        updateSelectedPreset(recBTData[24]);
        //Ask for the preset data if this is just booted
        if(isInitBoot == true){
          Serial.println("Asking for current preset data");
          SerialBT.write(GET_CURR_PRESET_DATA_CMD, 60);
          isInitBoot = false;
        }
      }
      //Received the preset changed response
      else if (recBTDataIndex == 23 && recBTData[0] == 0x01 && recBTData[1] == 0xFE && recBTData[4] == 0x41 && recBTData[5] == 0xFF && recBTData[6] == 0x17 && recBTData[18] == 0x24) {
        //TODO: revisit here. I liked the reactive nature here, but this can a bit slow. (Changed to send the reqeuest right after send the presetn change command.)
        //Request the current preset's configuration data to update the fx status
        //Serial.println("Asking for current preset data");
        //SerialBT.write(GET_CURR_PRESET_DATA_CMD, 60);
      }
    }

    //Reset index and clear the array since this is the end of the message
    recBTDataIndex = 0;
    memset(recBTData, 0, sizeof(recBTData));
    memset(recBTDataTrimmed, 0, sizeof(recBTDataTrimmed));
    memset(asciiData, 0, sizeof(asciiData));
  }
}

void setup() {
  isInitBoot = true;
  pinMode(LED_DRIVE_GPIO, OUTPUT);
  pinMode(LED_MOD_GPIO, OUTPUT);
  pinMode(LED_DELAY_GPIO, OUTPUT);
  // Start serial debug console monitoring
  Serial.begin(115200);
  while (!Serial);

  // Set initial device state values
  isBTConnected = false;
  selectedPreset = 0;
  
  btnSetup();
  initDisplay();
  initBT();
}

void loop() {
  // Check if amp is connected to device
  if (!isBTConnected) {
    // If not, attempt to establish a connection
    connectToAmp();
  } else { // If amp is connected to device over BT
    // Read button inputs
    btn_drive.read();
    btn_mod.read();
    btn_delay.read();
    btn_preset_up.read();
    btn_preset_down.read();    
    // Read in response data from amp, to clear BT message buffer
    if (SerialBT.available() > 0) { //If there is coming data in the pipeline
      processRecBTData(SerialBT.read()); //read 1 byte
    }
  }
}
