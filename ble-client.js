// 引入 @abandonware/noble 库
const noble = require('@abandonware/noble');

// 定义服务和特性的 UUID
const uuid_service = "1101"; // 你的 Arduino IMU 服务 UUID
const uuid_characteristic = "2101"; // 你的 Arduino IMU 特性 UUID

// 监听 BLE 适配器状态变化事件
noble.on('stateChange', async (state) => {
  if (state === 'poweredOn') {
    console.log("BLE adapter is powered on, starting scan...");
    await noble.startScanningAsync([uuid_service], false);
  } else {
    console.log("BLE adapter is not available. Please check your adapter.");
    noble.stopScanning();
  }
});

// 监听设备发现事件
noble.on('discover', async (peripheral) => {
  console.log(`Discovered device: ${peripheral.advertisement.localName}`);
  await noble.stopScanningAsync();

  // 连接到发现的设备
  await peripheral.connectAsync();
  console.log("Connected to the Arduino Nano 33 IoT");

  // 发现服务和特性
  const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
    [uuid_service],
    [uuid_characteristic]
  );

  const imuCharacteristic = characteristics[0];

  // 订阅特性通知
  imuCharacteristic.subscribe((error) => {
    if (error) {
      console.error("Failed to subscribe to characteristic:", error);
    } else {
      console.log("Subscribed to IMU characteristic notifications");
    }
  });

  // 处理接收到的数据
  imuCharacteristic.on('data', (data) => {
    const imuValue = data.readFloatLE(0); // 假设数据是浮点类型，小端模式
    console.log("IMU X-axis acceleration:", imuValue);
  });

  // 处理断开连接事件
  peripheral.on('disconnect', () => {
    console.log("Disconnected from Arduino Nano 33 IoT. Exiting...");
    process.exit(0); // 退出程序
  });
});
