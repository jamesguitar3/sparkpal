const fxStatusEndingRegEx = /(43|42)[a-zA-Z0-9.]{6,8}4a/;
const presetDataPrefixRegEx =/01fe000041ff6a000000000000000000/gi;
const fxRegEx = {    
    noisegate:{
        noisegate: /n.*?o.*?i.*?s.*?e.*?g.*?a.*?t.*?e/,
    },
    compressor:{
        compressor: /c.*?o.*?m.*?p.*?r.*?e.*?s.*?s.*?o.*?r/,
        bluecomp: /b.*?l.*?u.*?e.*?c.*?o.*?m.*?p/,
        basscomp: /b.*?a.*?s.*?s.*?c.*?o.*?m.*?p/,
        la2acomp: /l.*?a.*?2.*?a.*?c.*?o.*?m.*?p/, //??
        opticalcomp: /o.*?p.*?t.*?i.*?c.*?a.*?l.*?c.*?o.*?m.*?p/,
    },
    drive:{        
        booster: /b.*?o.*?o.*?s.*?t.*?e.*?r/,
        tubedrive: /d.*?i.*?s.*?t.*?o.*?r.*?t.*?i.*?o.*?n.*?t.*?s.*?9/,
        overdrive: /o.*?v.*?e.*?r.*?d.*?r.*?i.*?v.*?e/,
        fuzz: /f.*?u.*?z.*?z/,
        procorat: /p.*?r.*?o.*?c.*?o.*?r.*?a.*?t/,
        bassmuff: /b.*?a.*?s.*?s.*?m.*?u.*?f.*?f/,
        guitarmuff: /g.*?u.*?i.*?t.*?a.*?r.*?m.*?u.*?f.*?f/,
        bassmaster: /b.*?a.*?s.*?s.*?m.*?a.*?s.*?t.*?e.*?r/,        
        sabdrive: /s.*?a.*?b.*?d.*?r.*?i.*?v.*?e/,
    },
    amp:{},
    mod:{
        tremolo: /t.*?r.*?e.*?m.*?o.*?l.*?o/,
        chorusanalog: /c.*?h.*?o.*?r.*?u.*?s.*?a.*?n.*?a.*?l.*?o.*?g/,
        flanger: /f.*?l.*?a.*?n.*?g.*?e.*?r/,        
        phaser: /p.*?h.*?a.*?s.*?e.*?r/,        
        vibrato: /v.*?i.*?b.*?r.*?a.*?t.*?o/,
        univibe: /u.*?n.*?i.*?t.*?v.*?i.*?b.*?e/,
        cloner: /c.*?l.*?o.*?n.*?e.*?r/,
        minivibe: /m.*?i.*?n.*?i.*?v.*?i.*?b.*?e/,
        tremolator: /t.*?r.*?e.*?m.*?o.*?l.*?a.*?t.*?o.*?r/,
        tremolosquare: /t.*?r.*?e.*?m.*?o.*?l.*?o.*?s.*?q.*?u.*?a.*?r.*?e/,
    },
    delay:{
        digitaldelay: /d.*?e.*?l.*?a.*?y.*?m.*?o.*?n.*?o/,
        delayechofilt: /d.*?e.*?l.*?a.*?y.*?e.*?c.*?h.*?o.*?f.*?i.*?l.*?t/,
        vintagedelay: /v.*?i.*?n.*?t.*?a.*?g.*?e.*?d.*?e.*?l.*?a.*?y/,        
        delayreverse: /d.*?e.*?l.*?a.*?y.*?r.*?e.*?v.*?e.*?r.*?s.*?e/,
        delaymultihead: /d.*?e.*?l.*?a.*?y.*?m.*?u.*?l.*?t.*?i.*?h.*?e.*?a.*?d/,
        delayre20: /d.*?e.*?l.*?a.*?y.*?r.*?e.*?2.*?0/,
    },
    reverb:{
        biasreverb: /b.*?i.*?a.*?s.*?r.*?e.*?v.*?e.*?r.*?b/,
    },
    unknown:{}
}
const dataPrefix = {    
    fxStatusChange: "01fe000041ff17000000000000000000f",
    presetData: "01fe000041ff6a000000000000000000",
    currentPreset: "01fe000041ff1a000000000000000000f001080",
    presetChanged: "01fe000041ff6a000000000000000000f00102000438f7f0010",
}
const fxStatusCode = {on: "43", off: "42"};
const command = {
    preset:{
        current: "01fe000053fe17000000000000000000f00108000210f779", //current preset number
        currentData: "01fe000053fe3c000000000000000000f0010a01020100010000000000000000000000000000000000000000000000000000000000000000000000f779", //Get current preset data
        set1: "01fe000053fe1a000000000000000000f00102000138000000f779",
        set2: "01fe000053fe1a000000000000000000f00102000138000001f779",
        set3: "01fe000053fe1a000000000000000000f00102000138000002f779",
        set4: "01fe000053fe1a000000000000000000f00102000138000003f779",
    },
    fx:{
        drive:{        
            booster: {                
                code: "01fe000053fe23000000000000000000f0011b370115020727426f6f7374046572",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            tubedrive: {
                code: "01fe000053fe2a000000000000000000f00127760115020d2d446973746f007274696f6e54530239",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            overdrive: {
                code: "01fe000053fe25000000000000000000f001113201150209294f766572641072697665",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },            
            fuzz: {
                code: "01fe000053fe1f000000000000000000f0011213011542042446757a7a",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            procorat: {
                code: "01fe000053fe24000000000000000000f001244f011502082850726f436f08526174",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            bassmuff: {
                code: "01fe000053fe27000000000000000000f00135770115020b2b42617373424069674d756666",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            guitarmuff: {
                code: "01fe000053fe26000000000000000000f00103440115020a2a477569746120724d756666",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            bassmaster: {
                code: "01fe000053fe2e000000000000000000f001182c01150211314d6165737400726f426173736d206173746572",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            sabdrive: {
                code: "01fe000053fe25000000000000000000f0013b3e011502092953414264721069766572",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
        },        
        mod:{
            tremolo: {
                code: "01fe000053fe23000000000000000000f001252601150207275472656d6f046c6f",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            chorusanalog: {
                code: "01fe000053fe29000000000000000000f001127b0115020c2c43686f72750073416e616c6f6701",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            flanger: {
                code: "01fe000053fe23000000000000000000f0013d310115020727466c616e67046572",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            phaser: {
                code: "01fe000053fe22000000000000000000f0010d5f011502062650686173650272",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            vibrato: {
                code: "01fe000053fe25000000000000000000f00125240115020929566962726110746f3031",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            univibe: {
                code: "01fe000053fe23000000000000000000f001010e0115020727556e695669046265",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            cloner: {
                code: "01fe000053fe22000000000000000000f001285b0115020626436c6f6e650272",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            minivibe: {
                code: "01fe000053fe24000000000000000000f0010f7301150208284d696e695608696265",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            tremolator: {
                code: "01fe000053fe26000000000000000000f0013d650115020a2a5472656d6f206c61746f72",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            tremolosquare: {
                code: "01fe000053fe2a000000000000000000f00130010115020d2d5472656d6f006c6f53717561720265",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
        },
        delay:{
            digitaldelay: {
                code: "01fe000053fe25000000000000000000f0011406011502092944656c6179104d6f6e6f",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            delayechofilt: {
                code: "01fe000053fe2a000000000000000000f00104210115020d2d44656c6179004563686f46696c0274",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            vintagedelay: {
                code: "01fe000053fe29000000000000000000f00123720115020c2c56696e746100676544656c617901",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            delayreverse: {
                code: "01fe000053fe29000000000000000000f00117740115020c2c44656c6179005265766572736501",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            delaymultihead: {
                code: "01fe000053fe2b000000000000000000f0013b500115020e2e44656c6179004d756c74694865046164",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
            delayre20: {
                code: "01fe000053fe26000000000000000000f0012c110115020a2a44656c6179205265323031",
                get on(){ return this.code + fxStatusCode.on + "f779"},
                get off(){ return this.code + fxStatusCode.off + "f779"},
            },
        },
    }    
}

const hexToASCII = (hexStr, removeNonAlphanumChar=true) => {
	var hex  = hexStr.toString();
	var str = '';
	for (var n = 0; n < hex.length; n += 2)
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    str = removeNonAlphanumChar ? str.replace(/[^a-z0-9]/gi,'').toLowerCase() : str;    
	return str;
};
 
const parseFxId = (hexStr) => {        
    let convertedStr = hexToASCII(hexStr);    
    for (let fxType of Object.keys(fxRegEx)){
        for (const [key, value] of Object.entries(fxRegEx[fxType])) {        
            if(convertedStr.match(value))            
                return {fxType, fxId:key};                
        }
    }    
};
 
const parsePresetData = (input) => {
    let resultArray;
    let fxStatus = {};
    let content = input;
    //Removed all the message starting prefixes        
    content = content.replace(presetDataPrefixRegEx, "");
    //Find each fx status flag
    while ((resultArray = fxStatusEndingRegEx.exec(content)) !== null){  
        let endingIndex = resultArray.index;
        let endingCode = resultArray[0];      
        //Parse the data before the ending flag to determine the fx id
        let fx = parseFxId(content.substr(0, endingIndex));                
        if(fx){            
            let enabled = endingCode.substr(0,2) === "43" ? true : false;
            fxStatus[fx.fxType]= {id: fx.fxId, enabled};        
        }
        content = content.substr(endingIndex + endingCode.length);                   
    }    
    return fxStatus;    
};

const isLastPresetDataMessage = (hexStr) => {    
    //TODO: find the last message's sequence instead of checking for 'reverb'
    let convertedStr = hexToASCII(hexStr);            
    return fxRegEx.reverb.biasreverb.test(convertedStr);
};

module.exports = {command, dataPrefix, isLastPresetDataMessage, parsePresetData};