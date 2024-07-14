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

import { Agent } from '@/utils/Agent';

export const DeviceView = (props: { photos: string[] }) => {
  // function toBase64Image(src: Uint8Array) {
  //   const characters = Array.from(src, (byte) =>
  //     String.fromCharCode(byte)
  //   ).join('');
  //   return 'data:image/jpeg;base64,' + btoa(characters);
  // }
  
  // for the agent 
  const agent = React.useMemo(() => new Agent(), []);
  const agentState = agent.use();

  const [photos, setPhotos] = React.useState<string[]>([]);
  const [voiceInputSwitch, setVoiceInputSwitch] = React.useState<boolean>(true);
  const [userPrompt, setUserPrompt] = React.useState<string>(
    'To begin capturing pictures, please ask a question to the assistant.'
  );

  React.useEffect(() => {
    // console.log('photos updated');
    // if (props.photos.length > 0) {
    //   setPhotos(props.photos.map(toBase64Image));
      // agent.addPhoto(props.photos);
    // }
    setPhotos(props.photos);
  }, [props.photos]);



  // React.useEffect(() => {
  //   // connectToDevice(props.selectedDevice);
  // }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ padding: 10 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Image
            source={require('../assets/usr.png')}
            style={{ width: 35, height: 35 }}
          />

          <Text
            style={{
              flex: 1,
              color: 'white',
              fontSize: 16,
              textAlign: 'left',
              padding: 0,
              verticalAlign: 'middle',
            }}
          >
            {userPrompt}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 4,
            marginTop: 10,
            paddingLeft: 42,
          }}
        >
          {photos.map((photo, index) => (
            <Image
              key={index}
              style={{
                width: 120,
                height: 120,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: 'darkgreen',
              }}
              source={{ uri: photo }}
            />
          ))}
        </View>
      </ScrollView>

      {/* input content  */}

      <View
        style={{ width: '100%', padding: 20, position: 'absolute', bottom: 0 }}
      >
        <View
          style={{
            backgroundColor: 'rgb(28 28 28)',
            width: '100%',
            borderRadius: 5,
            flexDirection: 'column',
            paddingLeft: 8,
            paddingRight: 8,
          }}
        >
          {/* for switch  */}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
              paddingLeft: 5,
            }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>Voice Input</Text>
            <Switch
              value={voiceInputSwitch}
              onValueChange={() => setVoiceInputSwitch(!voiceInputSwitch)}
            />
          </View>

          <View
            style={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            {agentState.loading && (
              <ActivityIndicator size="large" color={'white'} />
            )}
            {agentState.answer && !agentState.loading && (
              <ScrollView style={{ flexGrow: 1, flexBasis: 0 }}>
                <Text style={{ color: 'white', fontSize: 16 }}>
                  {agentState.answer}
                </Text>
              </ScrollView>
            )}
          </View>

          {}

          {!voiceInputSwitch && (
            <TextInput
              style={{
                color: 'white',
                fontSize: 16,
                borderRadius: 4,
                backgroundColor: 'rgb(48 48 48)',
                padding: 4,
                marginBottom: 14,
              }}
              placeholder="Enter your prompt"
              placeholderTextColor={'#888'}
              readOnly={agentState.loading}
              onSubmitEditing={(e) => agent.answer(e.nativeEvent.text)}
            />
          )}
        </View>
      </View>
    </View>
  );
};
