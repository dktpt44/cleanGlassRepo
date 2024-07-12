import { useMemo, useState } from 'react';
import { Device, Characteristic, BleError, BleManager } from 'react-native-ble-plx';


import { PermissionsAndroid, Platform } from 'react-native';

interface BluetoothLowEnergyApi {
  blePoweredOn: boolean;
  requestBluetoothPermission(): Promise<boolean>;
  scanForPeripherals(): void;
  allDevices: Device[];
  connectToDevice: (deviceId: Device, callbckfn: Function) => Promise<void>;
  deviceConnected: string;
}

const SERVICE_UUID = '19B10000-E8F2-537E-4F6C-D104768A1214'.toLowerCase();
const PHOTO_CHARACTERISTIC = '19b10005-e8f2-537e-4f6c-d104768a1214';

export default function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [blePoweredOn, setBleState] = useState<boolean>(false);
  const [deviceConnected, setDeviceConnected] = useState<string>("stagezero");

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
      if (device && device.name?.includes('Open')) {
        setAllDevices((prevState: Device[]) => {

          if (!(prevState.findIndex((d)=> device.id === d.id) > -1)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });
  };

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

    console.log('Data Recieved', characteristic.value);

    // const rawData = base64.decode

    // let array = new Uint8Array(characteristic.value);
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
    deviceConnected
  };
}
