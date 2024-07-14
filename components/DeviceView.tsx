import * as React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, View, Switch } from 'react-native';
import axios from 'axios';
import * as Speech from 'expo-speech';

export const DeviceView = (props: { photos: string[]; setStartInfering: (status: boolean) => void }) => {
  const [voiceInputSwitch, setVoiceInputSwitch] = React.useState<boolean>(true);
  const [userPrompt, setUserPrompt] = React.useState<string>('To begin capturing pictures, please ask a question to the assistant.');
  const [waitForPictures, setWaitForPictures] = React.useState<boolean>(false);
  const [inferRequestProcessing, setInferRequestProcessing] = React.useState<boolean>(false);

  const [assistantAnswer, setAssistantAnswer] = React.useState<string>('');

  const makeRequest = async (userTypedPrompt: string | null) => {
    // make first request about the first image
    // make second request about the second image
    // make final request to the assistant
    let requestPrompt = '';
    if (userTypedPrompt) {
      requestPrompt = userTypedPrompt;
    } else {
      requestPrompt = userPrompt || ' Describe what you see in these two image descriptions taken 2 seconds apart. Just summarize what you see in the images.';
    }

    console.log('Making requestPrompt', requestPrompt);

    // make request to the assistant
    try {
      const response = await axios.post('http://cai-003.abudhabi.nyu.edu:54345/process_image', { image: props.photos[0], prompt: requestPrompt });

      if (response.status === 200) {
        // check if esists
        if (response.data.choices[0].message.content) {
          setAssistantAnswer(response.data.choices[0].message.content);
          console.log('response', response.data.choices[0].message.content);
          Speech.speak(response.data.choices[0].message.content);
        } else {
          setAssistantAnswer('No answer from the assistant at the moment.');
        }
      }
      // catch error
    } catch (error) {
      console.log('error', error);
      setAssistantAnswer('Something went wrong, sorry.');
    }
    setInferRequestProcessing(false);
    setWaitForPictures(false);
    props.setStartInfering(false);

  };

  const startInterfingForUser = (textVal: string) => {
    if (inferRequestProcessing) {
      return;
    }
    setUserPrompt(textVal);
    setInferRequestProcessing(true);
    if (props.photos.length === 1) {
      // show please wait while infering
      makeRequest(textVal);
    } else {
      setWaitForPictures(true);
    }
  };

  React.useEffect(() => {
    // console.log('photos updated');
    if (props.photos.length === 2 && waitForPictures) {
      setWaitForPictures(false);
      makeRequest(null);
    }
  }, [props.photos]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ padding: 10 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Image
            source={require('../assets/usr.png')}
            style={{ width: 35, height: 35 }}
          />

          <Text style={{ flex: 1, color: 'white', fontSize: 16, textAlign: 'left', padding: 0, verticalAlign: 'middle' }}>{userPrompt}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 10, paddingLeft: 42 }}>
          {props.photos.map((photo, index) => (
            <Image
              key={index}
              style={{ width: 120, height: 120, borderRadius: 5, borderWidth: 1, borderColor: 'darkgreen' }}
              source={{ uri: photo }}
            />
          ))}
        </View>
      </ScrollView>

      {/* input content  */}

      <View style={{ width: '100%', padding: 20, position: 'absolute', bottom: 0 }}>
        <View style={{ backgroundColor: 'rgb(28 28 28)', width: '100%', borderRadius: 5, flexDirection: 'column', paddingLeft: 8, paddingRight: 8 }}>
          {/* for switch  */}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingLeft: 5 }}>
            <Text style={{ color: 'white', fontSize: 16 }}>Voice Input</Text>
            <Switch
              value={voiceInputSwitch}
              onValueChange={() => setVoiceInputSwitch(!voiceInputSwitch)}
            />
          </View>

          <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
            {inferRequestProcessing && (
              <ActivityIndicator
                size="small"
                color={'white'}
              />
            )}
            {assistantAnswer && !inferRequestProcessing && (
              <ScrollView style={{ flexGrow: 1, flexBasis: 0 }}>
                <Text style={{ color: 'white', fontSize: 14 }}>{assistantAnswer}</Text>
              </ScrollView>
            )}
          </View>

          {!voiceInputSwitch && (
            <TextInput
              style={{ color: 'white', fontSize: 16, borderRadius: 4, backgroundColor: 'rgb(48 48 48)', padding: 4, marginBottom: 14 }}
              placeholder="Enter your prompt"
              placeholderTextColor={'#888'}
              // on focus
              onFocus={() => props.setStartInfering(true)}
              readOnly={inferRequestProcessing}
              onSubmitEditing={(e) => startInterfingForUser(e.nativeEvent.text)}
            />
          )}
        </View>
      </View>
    </View>
  );
};
