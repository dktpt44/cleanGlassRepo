import { useMemo, useState } from 'react';
import { Device, Characteristic, BleError, BleManager } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
// import { rotateImage } from '@/utils/imaging';
// import { decode } from 'react-native-base64';
// global.Buffer = global.Buffer || require('buffer').Buffer;
// import { Buffer } from 'react-native-buffer';
import { Buffer } from 'buffer';

interface BluetoothLowEnergyApi {
  blePoweredOn: boolean;
  requestBluetoothPermission(): Promise<boolean>;
  scanForPeripherals(): void;
  allDevices: Device[];
  connectToDevice: (deviceId: Device, callbckfn: Function) => Promise<void>;
  deviceConnected: string;
  photos: string[];
}

const SERVICE_UUID = '19B10000-E8F2-537E-4F6C-D104768A1214'.toLowerCase();
const PHOTO_CHARACTERISTIC = '19b10005-e8f2-537e-4f6c-d104768a1214';

// let previousChunk = -1;
// let buffer = new Uint8Array(0);

let imageData = "";
let framesCount = 0;

export default function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [blePoweredOn, setBleState] = useState<boolean>(false);
  const [deviceConnected, setDeviceConnected] = useState<string>("stagezero");
  const [photos, setPhotos] = useState<string[]>([]);


  // method 1: check if bluetooh enabled or not
  bleManager.onStateChange((state) => {
    if (state === 'PoweredOn') {
      setBleState(true);
    } else {
      setBleState(false);
    }
  }, true);

  // method 2: request bluetooth permission
  const requestBluetoothPermission = async () => {
    if (Platform.OS === 'ios') {
      return true;
    }
    if (
      Platform.OS === 'android' &&
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    ) {
      const apiLevel = parseInt(Platform.Version.toString(), 10);

      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      if (
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN &&
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      ) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          result['android.permission.BLUETOOTH_CONNECT'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_SCAN'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }
    }

    // this.showErrorToast('Permission have not been granted')

    return false;
  };

  // method 3: scan for devices
  const scanForPeripherals = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }
      if (device && device.name?.includes('')) {
        setAllDevices((prevState: Device[]) => {

          if (!(prevState.findIndex((d)=> device.id === d.id) > -1)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });
  };

  // const decodeBase64 = (input: string): Uint8Array => {
  //   const binaryString = atob(input);
  //   const length = binaryString.length;
  //   const bytes = new Uint8Array(length);
  //   for (let i = 0; i < length; i++) {
  //     bytes[i] = binaryString.charCodeAt(i);
  //   }
  //   return bytes;
  // };
  

  // // on getting the chunk of data
  // const onChunk = (id: number | null, data: Uint8Array) => {
  //   // Resolve if packet is the first one
  //   if (previousChunk === -1) {
  //     if (id === null) {
  //       return;
  //     } else if (id === 0) {
  //       previousChunk = 0;
  //       buffer = new Uint8Array(0);
  //     } else {
  //       return;
  //     }
  //   } else {
  //     if (id === null) {
  //       // console.log('Photo received', buffer);
  //       // rotateImage(buffer, '270').then((rotated) => {
  //       //   console.log('Rotated photo', rotated);
  //       //   setPhotos((p) => [...p, rotated]);
  //       // });
  //       console.log('Photo received.');
  //       // setPhotos((p) => [...p, buffer]);
  //       previousChunk = -1;
  //       return;
  //     } else {
  //       if (id !== previousChunk + 1) {
  //         previousChunk = -1;
  //         console.error('Invalid chunk', id, previousChunk);
  //         return;
  //       }
  //       previousChunk = id;
  //     }
  //   }
  
  //   // Append data
  //   buffer = new Uint8Array([...buffer, ...data]);
  // };

  const onDataUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null
  ) => {
    if (error) {
      console.log(error);
      return -1;
    } else if (!characteristic?.value) {
      console.log('No Data was recieved');
      return -1;
    }
    // console.log('Data Recieved', characteristic.value);

    const frameBuffer = Buffer.from(characteristic.value, 'base64');

    // console.log('Frame Buffer:', frameBuffer);
    // print length 
    // console.log('Frame Buffer Length:', frameBuffer.length);

    if (frameBuffer[0] === 0xFF && frameBuffer[1] === 0xFF) {
      // End of image flag
      const imageUri = `data:image/jpeg;base64,${imageData}`;
      // setImageData(imageUri);
      // console.log('Photo End');
      // console.log(imageUri);
      setPhotos((p) => [...p, imageUri]);

      imageData = '';
      // console.log('\n\nImage received successfully');
    } else {
      // Accumulate image data
      // console.log("After slice: ", frameBuffer.slice(2).toString('base64'))
      const packtNumber = frameBuffer[0] + (frameBuffer[1] << 8);
      // console.log(`Received packet ${packtNumber}`);
      imageData += frameBuffer.slice(2).toString('base64');
      // console.log(`Received frame ${framesCount}`);
    }
  };

  const startStreamingData = async (device: Device) => {
    if (device) {
      device.monitorCharacteristicForService(
        SERVICE_UUID,
        PHOTO_CHARACTERISTIC,
        onDataUpdate
      );
    } else {
      console.log('No Device Connected');
    }
  };

  // method 4: connect to device
  const connectToDevice = async (device: Device, callbckfn: Function) => {
    setDeviceConnected("connecting");
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();
      startStreamingData(deviceConnection);
      setDeviceConnected("connected");
      callbckfn("connected")
    } catch (e) {
      console.log('FAILED TO CONNECT', e);
      setDeviceConnected("failed");
      callbckfn("failed");
    }
  };


  return {
    blePoweredOn,
    scanForPeripherals,
    requestBluetoothPermission,
    connectToDevice,
    allDevices,
    deviceConnected,
    photos
  };
}
