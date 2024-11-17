// // 引入 noble 和 express
// const noble = require('@abandonware/noble');
// const express = require('express');
// const app = express();
// const port = 3000;

// // 初始化 BLE UUID 和传感器值
// const uuid_service = "1101";
// const uuid_value = "2101";
// let sensorValue = NaN;


// // 设置 BLE 事件监听
// noble.on('stateChange', async (state) => {
//     if (state === 'poweredOn') {
//         console.log("start scanning");
//         await noble.startScanningAsync([uuid_service], false);
//     }
// });

// noble.on('discover', async (peripheral) => {
//     await noble.stopScanningAsync();
//     await peripheral.connectAsync();
//     const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync([uuid_service], [uuid_value]);
//     readData(characteristics[0]);
// });

// // 周期性读取数据
// let readData = async (characteristic) => {
//     const value = (await characteristic.readAsync());
//     sensorValue = value.readFloatLE(0); // 更新 sensorValue
//     console.log(sensorValue);

//     setTimeout(() => {
//         readData(characteristic);
//     }, 10);
// };




// // 配置 Express.js 路由
// app.set('view engine', 'ejs');

// app.get('/', (req, res) => {
//     res.render('index');
// });


// app.post('/data', (req, res) => {
//     res.writeHead(200, { 'Content-Type': 'application/json' });
//     res.end(JSON.stringify({ sensorValue: sensorValue }));
// });


// // 启动服务器
// app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`);
// });





// 引入 noble 和 express
const noble = require('@abandonware/noble');
const express = require('express');
const app = express();
const port = 3000;

// 初始化 BLE UUID 和传感器值
const uuid_service = "1101";
const uuid_value = "2101";
let sensorValues = [NaN, NaN, NaN, NaN, NaN, NaN]; // 存储 6 个传感器值

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
        sensorValues[i] = value.readFloatLE(i * 4);
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

app.post('/data', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ sensorValues: sensorValues }));
});

// 启动服务器
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
