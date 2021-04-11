# SparkPal - esp32 version

## Overview
I switched from Raspberry Pi Zero to esp32 due to rpi's long booting time and the need of safe-shutdown circuit. This is the current project I am using for myself.

## Hardware
* ESP32 (wifi + Bluetooth) board
  https://www.amazon.com/gp/product/B07Q576VWZ/
* SSD1306 OLED LCD
  https://www.amazon.com/gp/product/B07X245RPC/
* 5 normally open switches
  https://www.amazon.com/gp/product/B0751BHY99/
* 1 2-position DPDT toggle switch
  https://www.amazon.com/gp/product/B07QGBW6XZ/
* Adafruit Powerboost 500 Charger
  https://www.amazon.com/Adafruit-PowerBoost-500-Charger-Rechargeable
* Lipo battery (I had to flip the red and black wires for this specific  battery)
  https://www.amazon.com/gp/product/B07BTRLKPT   
* Enclosure box
  https://www.amazon.com/gp/product/B00HKIRKRQ/
* 3mm LEDs X 4 and resistors   

## Wiring
![wiring image](../assets/SparkPal_esp32_wiring.jpg?raw=true "wiring")

## Software
* Arduion IDE
* Libraries
   * ButtonFever
   * Adafruit SSD1306 (You may need a different one depending on what LCD screen you have)
   * Regexp


