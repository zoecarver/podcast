const ip = 'cocoacast.herokuapp.com';
const port = '';

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
  TouchableOpacity,
  Button,
} from 'react-native';
import {
  getTheme,
  MKRangeSlider,
  MKSlider,
  MKTextField,
  MKSwitch,
  MKCheckbox,
  MKIconToggle,
} from 'react-native-material-kit';

const MK = require('react-native-material-kit');
const { MKButton, MKSpinner, MKColor } = MK;
const theme = getTheme();
const FlatEppisodeButton = MKButton.flatButton()
  .withText('EPISODES')
  .build();

let { height, width } = Dimensions.get('window');

export default (state, FlatEppisodeButtonOnPress) => {
  this.state = state;

  console.log('starting ', this.state.subs);
  var output = [];

  var loading = (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        width: width,
        height: height,
      }}
    >
      <MKSpinner />
    </View>
  );

  this.state.subs.forEach((data, i) => {
    console.log(
      'https://itunes.apple.com/lookup?id=' +
        data.data.collectionId +
        '&entity=podcast' +
        ' --:-- ' +
        this.state.user.subscriptions
    );
    output.push(
      <View
        style={[theme.cardStyle, { width: width * 0.9, margin: width * 0.05 }]}
      >
        <Image
          source={{ uri: data.data.artworkUrl600 }}
          style={theme.cardImageStyle}
        />
        <Text style={theme.cardContentStyle}>
          {data.title}
          {data.artistName ? ': ' + data.artistName : null}
          {'\n \n' + data.description}
        </Text>
        <View style={theme.cardMenuStyle}>
          {this.state.user.subscriptions.includes(
            'https://itunes.apple.com/lookup?id=' +
              data.data.collectionId +
              '&entity=podcast'
          ) ? (
            <MKButton
              backgroundColor={MKColor.Teal}
              shadowRadius={2}
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.7}
              shadowColor="black"
              onPress={() => {
                this.unSubscribe(data.data.collectionId);
              }}
            >
              <Text
                pointerEvents="none"
                style={{ color: 'white', fontWeight: 'bold' }}
              >
                UNSUBSCRIBE
              </Text>
            </MKButton>
          ) : (
            <MKButton
              backgroundColor={MKColor.Teal}
              shadowRadius={2}
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.7}
              shadowColor="black"
              onPress={() => {
                this.subscribe(data.data.collectionId);
              }}
            >
              <Text
                pointerEvents="none"
                style={{ color: 'white', fontWeight: 'bold' }}
              >
                SUBSCRIBE
              </Text>
            </MKButton>
          )}
        </View>
        <View style={theme.cardActionStyle}>
          <FlatEppisodeButton
            onPress={FlatEppisodeButtonOnPress.bind(
              null,
              data,
              data.data.artworkUrl600,
              data.title
            )} //
          />
        </View>
      </View>
    );
  });

  return this.state.loaded ? output : loading;
};
