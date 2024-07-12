import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  View,
  Switch,
} from 'react-native';

export const DeviceView = () => {
  const [photos, setPhotos] = React.useState<Uint8Array[]>([]);
  const [userPrompt, setUserPrompt] = React.useState<string>(
    'To begin capturing pictures, please ask a question to the assistant.'
  );

  // React.useEffect(() => {
  //   // connectToDevice(props.selectedDevice);
  // }, []);

  return (
    <View>
      <Text>connection success.</Text>
    </View>
  );
};
