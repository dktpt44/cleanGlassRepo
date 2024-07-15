import * as React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, View, Switch, Pressable, useColorScheme, Platform, PermissionsAndroid, Alert } from 'react-native';
import axios from 'axios';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';
import { Colors } from '@/constants/Colors';

export const DeviceView = (props: { photos: string[]; setStartInfering: (status: boolean) => void }) => {
  const [voiceInputSwitch, setVoiceInputSwitch] = React.useState<boolean>(true);
  const [userPrompt, setUserPrompt] = React.useState<string>('To begin capturing pictures, please ask a question to the assistant.');
  const [waitForPictures, setWaitForPictures] = React.useState<boolean>(false);
  const [inferRequestProcessing, setInferRequestProcessing] = React.useState<boolean>(false);
  const colors = useColorScheme() === 'dark' ? Colors.dark : Colors.light;
  const [recordingAudio, setRecordingAudio] = React.useState<boolean>(false);
  const [assistantAnswer, setAssistantAnswer] = React.useState<string>('');

  const checkMicrophonePermission = async () => {
    if (Platform.OS === 'ios') {
      return true;
    }
    if (Platform.OS === 'android') {
      const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      if (hasPermission) {
        return true;
      } else {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          return false;
        }
      }
    }
  };

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
    console.log('Making requestPrompt', props.photos[0]);

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

  const onSpeechStart = () => {
    console.log('onSpeechStart');
  };

  const onSpeechEnd = () => {
    console.log('onSpeechEnd');
  };

  const onSpeechResults = (e: any) => {
    // console.log('onSpeechResults', e);
    setUserPrompt(e.value[0]);
    makeRequest(e.value[0]);
  };

  React.useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = (e) => console.log('onSpeechError', e);

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

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
              style={{ width: 240, height: 240, borderRadius: 5, borderWidth: 1, borderColor: 'darkgreen' }}
              source={{ uri: photo }}
            />
          ))}
        </View>
      </ScrollView>

      {/* input content  */}

      <View style={{ width: '100%', padding: 10, position: 'absolute', bottom: 18 }}>
        <View style={{ backgroundColor: 'rgb(28 28 28)', width: '100%', borderRadius: 5, flexDirection: 'column', paddingLeft: 12, paddingRight: 12 }}>
          {/* for switch  */}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingLeft: 8, marginTop: 18 }}>
            <Text style={{ color: 'white', fontSize: 16 }}>Voice Input</Text>
            <Switch
              value={voiceInputSwitch}
              onValueChange={() => {
                if (inferRequestProcessing) {
                  return;
                }
                setVoiceInputSwitch(!voiceInputSwitch);
              }}
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

          {/* for speech input  */}

          {voiceInputSwitch && (
            <Pressable
              style={{ width: '50%', borderColor: recordingAudio ? colors.error : colors.success, borderWidth: 1, borderRadius: 5, marginLeft: 'auto', marginRight: 'auto', marginBottom: 24, padding: 8, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 4 }}
              onPress={async () => {
                if (inferRequestProcessing) {
                  return;
                }
                const hasPermission = await checkMicrophonePermission();
                if (!hasPermission) {
                  Alert.alert('Permission Denied', 'Please enable microphone permission to use this feature.');
                  return;
                }
                if (recordingAudio) {
                  try {
                    Voice.removeAllListeners();
                    await Voice.stop();
                  } catch (error) {
                    console.log('error', error);
                  }
                } else {
                  setUserPrompt('Listening...');
                  try {
                    await Voice.start('en-US');
                  } catch (error) {
                    console.log('error', error);
                  }
                }
                setRecordingAudio(!recordingAudio);
              }}>
              <Image
                source={{
                  uri: 'https://cdn-icons-png.flaticon.com/512/4980/4980251.png'
                }}
                style={{ width: 40, height: 40 }}
              />
              <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>{recordingAudio ? 'Stop Recording' : 'Start Recording'}</Text>
            </Pressable>
          )}

          {/* for text input  */}
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
