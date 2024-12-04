// 引入 noble 和 express
const noble = require('@abandonware/noble');
const express = require('express');
const { SerialPort, ReadlineParser } = require('serialport');
const Readline = require('@serialport/parser-readline');

const app = express();
const port = 3000;

// 初始化 BLE UUID 和传感器值
const uuid_service = "1101";
const uuid_value = "2101";
let bleSensorValues = [NaN, NaN, NaN, NaN, NaN, NaN]; // 存储 6 个传感器值



// UNO 数据
let unoData = 'N/A';

// 初始化 SerialPort
const unoPort = new SerialPort({
    path: '/dev/tty.usbmodem11301',
    baudRate: 57600,
});

// 创建 ReadlineParser
const parser = unoPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// 监听数据
parser.on('data', (data) => {
    // console.log('Data from Uno:', data);
    // 提取 "weight: " 后的数值
    const line = data.toString().trim();
    console.log('Data from Uno:', line);
    if (line.startsWith('weight:')) {
        const weight = line.replace('weight:', '').trim();
        
        unoData=weight;
    }
});

// 错误处理
unoPort.on('error', (err) => {
    console.error('SerialPort Error:', err.message);
});





// 设置 BLE 事件监听
noble.on('stateChange', async (state) => {
    if (state === 'poweredOn') {
        console.log("start scanning");
        await noble.startScanningAsync([uuid_service], false);
    }
});

noble.on('discover', async (peripheral) => {
    await noble.stopScanningAsync();
    await peripheral.connectAsync();
    const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync([uuid_service], [uuid_value]);
    readData(characteristics[0]);
});

// 周期性读取数据
let readData = async (characteristic) => {
    const value = await characteristic.readAsync();
    
    // 解析 6 个 float 值（小端格式）
    for (let i = 0; i < 6; i++) {
       bleSensorValues[i] = value.readFloatLE(i * 4);
    }

    // 打印接收到的 6 个传感器值
    // console.log(`Acceleration: x=${sensorValues[0]}, y=${sensorValues[1]}, z=${sensorValues[2]} | Gyroscope: x=${sensorValues[3]}, y=${sensorValues[4]}, z=${sensorValues[5]}`);

    // 每 10 毫秒继续读取数据
    setTimeout(() => {
        readData(characteristic);
    }, 10);
};

// 配置 Express.js 路由
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

// 向 Arduino 发送命令的函数
function sendCommand(command) {
    return new Promise((resolve, reject) => {
        if (unoPort && unoPort.isOpen) {
            unoPort.write(`${command}\n`, (err) => { // 确保附加换行符
                if (err) {
                    reject(`Error sending command: ${err.message}`);
                } else {
                    console.log(`Command sent: ${command}`); // 日志确认
                    resolve(`Command sent: ${command}`);
                }
            });
        } else {
            reject('Port is not open. Cannot send command.');
        }
    });
}


// API: 向 Arduino 发送命令
app.post('/send-command', async (req, res) => {
    const command = req.query.command || req.body.command;
    if (!command) {
        return res.status(400).json({ error: 'No command provided' });
    }

    try {
        const response = await sendCommand(command);
        res.json({ message: response });
    } catch (error) {
        res.status(500).json({ error });
    }
});

app.get('/data', (req, res) => {
    res.json({
        unoData: unoData || "No UNO data yet",
        bleSensorValues: bleSensorValues || [NaN, NaN, NaN, NaN, NaN, NaN],
    });
});


// 启动服务器
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

// curl -X POST "http://localhost:3000/send-command?command=t"
