# SparkPal: Pedal for PG Spark Amp

## Overview

This project is built with Node.js on Raspberry Pi Zero W. It connects to Positive Grid Spark amp over bluetooth connection and allows users to change preset 1-4 by tapping Up/Down, and turn individual Drive/Mod/Delay on/off by tapping its individual switch, like other commmon multi-effect pedal control apprach.

[Demo video here](https://www.youtube.com/watch?v=vtwOtqVu9dQ)

↓↓↓↓↓ Fun Time ↓↓↓↓↓
![Demo image](/assets/demo_esp32.jpg?raw=true "esp32")
(Was originally using RPI Zero W for the proof-of-concept, but switched to esp32 eventually)
![Demo image](/assets/demo_rpi.jpg?raw=true "rpi")

> Choose either the esp32 or RPI_Zero_W version for your build. I personally has swtiched to esp32.

> This project is inspired by Justin's [tinderboxpedal project](https://github.com/jrnelson90/tinderboxpedal), and [Morgan's command list](https://blog.studioblip.com/guitar/amps/spark/footpedalV1) was a great help for verifying my findings. 

[esp32](/esp32/)

[RPI_Zero_W](/rpi_zero_w/)

## Why two versions (esp32 vs RPI Zero W)?
Well, RPI Zero W is great and offers a lot of possibilities, but there are two things I dislike for this specific use case:
    1. ~50 seconds boot time
        I like my pedal ready to use as soon as possibe after turned on, and I think this 50 seconds booting time was dragging me away from wanna play it.
    2. Need safe-shutdown circuit
        While I had came up with a circuit using 2N5460 P-channel JFET and Adafruit PowerBoost 500 to allow it to safely shutdown, it wasn't the stablest thing. I've found it failed to function as expected a few times especially when the batter power level was low. I think there are ways to improve this, but I was just ready 
        to try the esp32 version
