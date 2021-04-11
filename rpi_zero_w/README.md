# SparkPal - RPI Zero W version

## Overview
This version is built using Raspberry Pi Zero W (with bluetooth) and Nodejs. RPI is an excellent platform for this protoype project and easy 
to get started with.

## Hardware
* Raspberry Pi Zero W (with bluetooth module) with micro SD card
* SSD1306 OLED LCD
* 5 normally open switches
* 3mm LEDs X 3 and resistors 

## Software
* Install Raspberry Pi OS Lite through the [RPI Imager](https://www.raspberrypi.org/software/)
* Node.js for armv6l [Instructions](https://www.thepolyglotdeveloper.com/2018/03/install-nodejs-raspberry-pi-zero-w-nodesource/)

### Environment Setup
* Execute `sudo raspi-config`, go to "Interfacing Options" and enable I2C (for the OLED display)
* Execute `sudo apt-get install build-essential libbluetooth-dev`
* Execute `npm install` in the project folder to install the libs