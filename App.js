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
import { ScrollView } from 'react-native';
import AddPaging from 'react-native-paged-scroll-view/index';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { google } from 'react-native-simple-auth';
import { AsyncStorage } from 'react-native';
import Storage from 'react-native-storage';
import RNFS from 'react-native-fs';
import PushNotification from 'react-native-push-notification';
import WS from 'react-native-websocket';
import { Player, Recorder, MediaStates } from 'react-native-audio-toolkit';
import importSyles from './styles';
import renderSubs from './src/renderSubs';
import {
  renderDownloads,
  getHeightOfPSV,
  getReadableTime,
  between,
} from './src/functions';
import { appId, callback } from './keys'; //You can obtain these keys from google: https://console.cloud.google.com/apis/credentials/oauthclient/

let { height, width } = Dimensions.get('window');
const styles = importSyles(width, height);

const MK = require('react-native-material-kit');
const PagedScrollView = AddPaging(ScrollView);
const { MKButton, MKSpinner, MKColor } = MK;
const theme = getTheme();

const PlainFab = MKButton.plainFab()
  .withStyle(styles.fab)
  .build();
const RaisedLoginButton = MKButton.button()
  .withText('LOG IN')
  .build();
const FlatEppisodeButton = MKButton.flatButton()
  .withText('EPISODES')
  .build();
const FlatHomeButton = MKButton.flatButton()
  .withText('HOME')
  .build();
const FlatLogoutButton = MKButton.flatButton()
  .withText('LOG OUT')
  .build();
const Textfield = MKTextField.textfield()
  .withPlaceholder('Search')
  .withStyle(styles.textfield)
  .withTextInputStyle({ flex: 1 })
  .build();

const playbackOptions = {
  autoDestroy: true,
  continuesToPlayInBackground: true,
};
let casting;
let storage = new Storage({
  size: 1000,
  storageBackend: AsyncStorage,
  defaultExpires: 1000 * 3600 * 24,
  enableCache: true,
  sync: {},
});

PushNotification.configure({
  onNotification: function(notification) {
    //TODO: make this function useful
  },
  popInitialNotification: true,
});

export default class podcast extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      subs: [],
      downloadedShows: [],
      currentlyDownloading: [],
    };

    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidMount() {
    this.loadUser(() => {
      console.log('Finish: loading user: ', this.state.user);
      this.loadSubs();
    });

    AsyncStorage.getItem('Offline', (err, result) => {
      if (result) {
        this.setState({ downloadedShows: JSON.parse(result) });
      } else {
        AsyncStorage.setItem('Offline', JSON.stringify([]), () => {
          this.setState({ downloadedShows: [] });
        });
      }
    });
  }

  loadSubs() {
    console.log('Start: loading subscriptions');
    fetch('http://' + ip + port + '/load', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.user,
      }),
    })
      .then(response => {
        return response.json();
      })
      .then(responseJson => {
        console.log('Finish: loading subscriptions: ', responseJson);
        this.setState({ subs: responseJson.arr, loaded: true });
      })
      .catch(error => {
        //TODO:handle this error better
        console.error(error);
      });
  }

  //TODO: use this function instead of inline downloads
  downloadAudioFile(url, item) {
    console.log('Start: Downloading podcast');
    var tmpArr = this.state.currentlyDownloading;
    tmpArr.push(item.title);
    this.setState({ currentlyDownloading: tmpArr });
    var urlName = url.split('/').slice(-1)[0];
    RNFS.downloadFile({
      fromUrl: url,
      toFile: `${RNFS.DocumentDirectoryPath}/` + urlName,
    }).promise.then(r => {
      console.log('Finish: Downloading podcast: ', urlName);

      AsyncStorage.getItem('Offline', (err, result) => {
        var jsonRes = JSON.parse(result);
        item.enclosures[0].url = `${RNFS.DocumentDirectoryPath}/` + urlName;

        if (Array.isArray(jsonRes)) {
          jsonRes.push(item);
        } else {
          jsonRes = [item];
        }

        AsyncStorage.setItem('Offline', JSON.stringify(jsonRes), () => {
          var index = tmpArr.indexOf(item.title);
          if (index > -1) {
            tmpArr.splice(index, 1);
          }
          this.setState({ currentlyDownloading: tmpArr });
          AsyncStorage.getItem('Offline', (err, result) => {
            this.setState({ downloadedShows: JSON.parse(result) });
          });
          //TODO: notify that audio has be successfully downloaded
        });
      });
    });
  }

  loadUser(callback) {
    AsyncStorage.getItem('User', (err, result) => {
      if (result) {
        this.setState({ user: JSON.parse(result) }, () => {
          callback();
        });
      } else {
        this.setState({ user: false });
      }
    });
  }

  loadOffline() {
    AsyncStorage.getItem('User', (err, result) => {
      this.setState({ offline: JSONG.parse(results) });
    });
  }

  subscribe(name) {
    fetch('http://' + ip + port + '/subscribe', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: this.state.user.id,
        podId: name,
      }),
    })
      .then(response => response.json())
      .then(responseJson => {
        AsyncStorage.setItem('User', JSON.stringify(responseJson), () => {
          this.loadUser(() => {
            this.loadSubs();
          });
        });
      })
      .catch(error => {
        console.error(error);
      });
  }

  unSubscribe(name) {
    fetch('http://' + ip + port + '/unsubscribe', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: this.state.user.id,
        podId: name,
      }),
    })
      .then(response => response.json())
      .then(responseJson => {
        AsyncStorage.setItem('User', JSON.stringify(responseJson), () => {
          this.loadUser(() => {
            this.loadSubs();
          });
        });
      })
      .catch(error => {
        console.error(error);
      });
  }

  componentWillUpdate() {
    if (casting && casting.isPrepared) {
      //TODO: something here to update where the audio slider is
    }
  }

  handleScroll(event) {
    if (event.nativeEvent.contentOffset.y > 199) {
      this.setState({ showName: true });
    } else {
      this.setState({ showName: false });
    }
  }

  _onChecked(event) {
    this.setState({ checked: event });
  }

  renderEpisode(show) {
    var output = [];

    if (show) {
      show.items.forEach((data, i) => {
        if (data.enclosures) {
          output.push(
            <View
              style={{
                width: width - 10,
                flexWrap: 'wrap',
                backgroundColor: 'white',
                alignItems: 'flex-start',
                flexDirection: 'row',
                elevation: 5,
                margin: 5,
              }}>
              <PlainFab
                key={i}
                style={{
                  height: 50,
                  borderRadius: 25,
                  width: 50,
                  margin: 10,
                }}
                onPress={() => {
                  if (
                    this.state.hasPlayedThisTrack !== data.enclosures[0].url
                  ) {
                    this.setState({ data: data });
                    if (casting) {
                      casting.destroy(); //TODO: handle error at some point
                      casting = null;
                    }
                    casting = new Player(
                      data.enclosures[0].url,
                      playbackOptions,
                    );
                  }

                  if (this.state.playing) {
                    this.setState({ playing: false });
                    casting.pause();
                  } else {
                    this.setState({ playing: data.enclosures[0].url });
                    casting.play().on('ended', () => {
                      //TODO: start more audio
                    });
                  }

                  this.setState({ hasPlayedThisTrack: data.enclosures[0].url });
                }}>
                {this.state.playing === data.enclosures[0].url ? (
                  <Icon
                    name="pause"
                    size={50}
                    style={{ backgroundColor: 'transparent' }}
                  />
                ) : (
                  <Icon
                    name="play-arrow"
                    size={50}
                    style={{ backgroundColor: 'transparent' }}
                  />
                )}
              </PlainFab>
              <View style={{ width: width - 90, textAlign: 'left' }}>
                <Text
                  style={[
                    styles.legendLabel,
                    { marginTop: 25, textAlign: 'left' },
                  ]}>
                  {data.title}
                </Text>
                <MKSwitch
                  checked={
                    this.state.downloadedShows.includes(
                      data.enclosures[0].url.split('/').slice(-1)[0],
                    )
                      ? true
                      : false
                  }
                  onCheckedChange={e => {
                    //TODO: use downloadAudioFile instead of this
                    AsyncStorage.getItem('Offline', (err, result) => {
                      var jsonRes = JSON.parse(result);

                      if (Array.isArray(jsonRes)) {
                        if (e.checked) {
                          this.downloadAudioFile(data.enclosures[0].url, data);
                          var tmpArr = this.state.downloadedShows;
                          tmpArr.push(
                            data.enclosures[0].url.split('/').slice(-1)[0],
                          );
                          this.setState({ downloadedShows: tmpArr });
                        } else {
                          for (var i = 0; i < jsonRes.length; i++) {
                            var path = data.enclosures[0].url
                              .split('/')
                              .slice(-1)[0];
                            if (
                              jsonRes[i].enclosures[0].url
                                .split('/')
                                .slice(-1)[0] === path
                            ) {
                              jsonRes.splice(i, 1);

                              RNFS.unlink(path)
                                .then(() => {
                                  //TODO: notify of deletion
                                })
                                .catch(err => {
                                  console.log(err.message);
                                  //TODO: handle the error
                                });
                            }
                          }

                          AsyncStorage.setItem(
                            'Offline',
                            JSON.stringify(jsonRes),
                            () => {
                              var tmpArr = this.state.downloadedShows;
                              tmpArr.splice(
                                tmpArr.indexOf(
                                  data.enclosures[0].url
                                    .split('/')
                                    .slice(-1)[0],
                                ),
                                1,
                              );
                              this.setState({ downloadedShows: tmpArr });
                            },
                          );
                        }
                      } else {
                      }
                    });
                  }}
                />
              </View>
            </View>,
          );
        }
      });
    }

    return output;
  }

  render() {
    var downloads = [];
    var toMap = renderDownloads(this.state.downloadedShows);

    if (Array.isArray(toMap)) {
      toMap.forEach((data, i) => {
        downloads.push(
          <View
            key={i}
            style={{
              width: width - 10,
              flexWrap: 'wrap',
              backgroundColor: 'white',
              alignItems: 'flex-start',
              flexDirection: 'row',
              elevation: 5,
              margin: 5,
            }}>
            <PlainFab
              key={i}
              style={{
                height: 50,
                borderRadius: 25,
                width: 50,
                margin: 10,
              }}
              onPress={() => {
                //TODO: create function that handles all play audio and replace this with it
                if (this.state.hasPlayedThisTrack !== data.enclosures[0].url) {
                  this.setState({ data: data });
                  if (casting) {
                    casting.destroy();
                    casting = null;
                  }
                  casting = new Player(data.enclosures[0].url, playbackOptions);
                }

                if (this.state.playing) {
                  this.setState({ playing: false });
                  casting.pause();
                } else {
                  this.setState({ playing: data.enclosures[0].url });
                  casting.play().on('ended', () => {});
                }

                this.setState({ hasPlayedThisTrack: data.enclosures[0].url });
              }}>
              {this.state.playing === data.enclosures[0].url ? (
                <Icon
                  name="pause"
                  size={50}
                  style={{ backgroundColor: 'transparent' }}
                />
              ) : (
                <Icon
                  name="play-arrow"
                  size={50}
                  style={{ backgroundColor: 'transparent' }}
                />
              )}
            </PlainFab>
            <View style={{ width: width - 90, textAlign: 'left' }}>
              <Text
                style={[
                  styles.legendLabel,
                  { marginTop: 25, textAlign: 'left' },
                ]}>
                {data.title}
              </Text>
              <MKSwitch
                checked={
                  this.state.downloadedShows.includes(
                    data.enclosures[0].url.split('/').slice(-1)[0],
                  )
                    ? true
                    : false
                }
                onCheckedChange={e => {
                  //TODO: move into function and replace all downloads with function
                  AsyncStorage.getItem('Offline', (err, result) => {
                    var jsonRes = JSON.parse(result);

                    if (Array.isArray(jsonRes)) {
                      if (e.checked) {
                        this.downloadAudioFile(data.enclosures[0].url, data);
                        var tmpArr = this.state.downloadedShows;
                        tmpArr.push(
                          data.enclosures[0].url.split('/').slice(-1)[0],
                        );
                        this.setState({ downloadedShows: tmpArr });
                      } else {
                        for (var i = 0; i < jsonRes.length; i++) {
                          var path = data.enclosures[0].url
                            .split('/')
                            .slice(-1)[0];
                          if (
                            jsonRes[i].enclosures[0].url
                              .split('/')
                              .slice(-1)[0] === path
                          ) {
                            jsonRes.splice(i, 1);

                            RNFS.unlink(path)
                              .then(() => {})
                              .catch(err => {
                                console.error(err.message);
                              });
                          }
                        }

                        AsyncStorage.setItem(
                          'Offline',
                          JSON.stringify(jsonRes),
                          () => {
                            var tmpArr = this.state.downloadedShows;
                            tmpArr.splice(
                              tmpArr.indexOf(
                                data.enclosures[0].url.split('/').slice(-1)[0],
                              ),
                              1,
                            );
                            this.setState({ downloadedShows: tmpArr });
                          },
                        );
                      }
                    }
                  });
                }}
              />
            </View>
          </View>,
        );
      });
    }

    this.state.currentlyDownloading.forEach(data => {
      downloads.push(<Text>DOWNLOADING: </Text>);
      downloads.push(<Text>{data}</Text>);
    });

    if (this.state.user) {
      return (
        <View>
          <PagedScrollView
            keyboardShouldPersistTaps={true}
            style={{
              height: getHeightOfPSV(casting, height),
              backgroundColor: '#F5FCFF',
            }}
            ref={pages => {
              this.PagedScrollView = pages;
            }}
            onInitialization={() => {
              //TODO: open to middle view
            }}
            pagingEnabled={true}
            horizontal={true}>
            <WS
              ref={ref => {
                this.ws = ref;
              }}
              url={'ws://' + ip + port + ''}
              onOpen={() => {
                if (this.state.user.id) {
                  this.ws.send(this.state.user.id);
                  console.log('Open: WebSocket');
                } else {
                  //TODO: fix whatever is going on here (server side)
                  this.ws.send('start');
                }
              }}
              onMessage={msg => {
                //TODO: fix notification
                console.log('Incoming: ', msg);
                var data = msg.data;
                if (data !== 'start') {
                  data = JSON.parse(data);
                  console.log('Received: ', data);

                  PushNotification.localNotification({
                    title: 'New episode of ' + data.title,
                    message: data.new.items[0].title,
                  });
                }
              }}
            />
            <ScrollView
              styles={{ width: width }}
              onScroll={this.handleScroll}
              keyboardShouldPersistTaps={true}>
              <View
                style={{
                  width: width,
                  backgroundColor: MKColor.BlueGrey,
                  height: 75,
                  justifyContent: 'space-between',
                }}>
                <Text
                  style={{
                    fontSize: 24,
                    marginTop: 25.5,
                    fontWeight: '800',
                    textAlign: 'center',
                  }}>
                  Downloads
                </Text>
              </View>
              <View
                style={{
                  width: width,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                }}>
                {downloads}
              </View>
            </ScrollView>
            <ScrollView
              styles={{ width: width }}
              keyboardShouldPersistTaps={true}>
              <View style={{ flexWrap: 'wrap', flexDirection: 'row' }}>
                <Textfield
                  onChangeText={text => this.setState({ search: text })}
                />
                <TouchableOpacity
                  onPress={() => {
                    this.setState({ loaded: false });
                    fetch(
                      'http://' + ip + port + '/search/' + this.state.search,
                    )
                      .then(response => response.json())
                      .then(responseJson => {
                        this.setState({ subs: [responseJson], loaded: true });
                      })
                      .catch(error => {
                        console.error(error);
                      });
                  }}>
                  <Icon
                    name="search"
                    size={30}
                    style={{ backgroundColor: 'transparent', marginTop: 15 }}
                  />
                </TouchableOpacity>
              </View>
              <View
                style={[
                  {
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                  styles.container,
                ]}>
                {renderSubs(
                  this.state,
                  (renderSubsData, artworkUrl600, title) => {
                    this.setState(
                      {
                        show: renderSubsData,
                        currentShow: artworkUrl600,
                        nameOfShow: title,
                      },
                      () => {
                        //TODO: find if this is important and get rid of it
                      },
                    );
                    this.PagedScrollView.scrollToPage(width * 2, 0, true);
                  },
                )}
              </View>
              <FlatHomeButton
                onPress={() => {
                  this.setState({ loaded: false });
                  this.loadSubs();
                }}
              />
              <FlatLogoutButton
                onPress={() => {
                  google({
                    appId: appId,
                    callback: callback,
                  })
                    .then(info => {
                      info.user.subscriptions = [];
                      console.log('Received: New user: ', info.user);

                      AsyncStorage.setItem(
                        'User',
                        JSON.stringify(info.user),
                        () => {
                          this.loadUser(() => {
                            //TODO: add if statment to the exicution of loadUser callback
                          });
                        },
                      );
                    })
                    .catch(error => {
                      //TODO: handle this error better
                      console.error(error);
                    });
                }}
              />
            </ScrollView>
            <View>
              {this.state.showName ? (
                <View
                  style={{
                    width: width,
                    backgroundColor: MKColor.BlueGrey,
                    height: 75,
                    justifyContent: 'space-between',
                  }}>
                  <Text
                    style={{
                      fontSize: 24,
                      marginTop: 25.5,
                      fontWeight: '800',
                      textAlign: 'center',
                    }}>
                    {this.state.nameOfShow}
                  </Text>
                </View>
              ) : null}
              <ScrollView
                styles={{ width: width }}
                onScroll={this.handleScroll}
                keyboardShouldPersistTaps={true}>
                <Image
                  source={{ uri: this.state.currentShow }}
                  style={{ width: width, height: 200 }}
                />
                <View
                  style={{
                    width: width,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                  }}>
                  {this.renderEpisode(this.state.show)}
                </View>
              </ScrollView>
            </View>
          </PagedScrollView>
          {casting ? (
            <View
              style={{
                width: width,
                backgroundColor: MKColor.BlueGrey,
                height: 75,
                flexWrap: 'wrap',
              }}>
              <PlainFab
                style={{
                  height: 50,
                  borderRadius: 25,
                  width: 50,
                  margin: 10,
                }}
                onPress={() => {
                  //TODO: again move this into function and use function for all audio play/pause
                  if (
                    this.state.hasPlayedThisTrack !==
                    this.state.data.enclosures[0].url
                  ) {
                    if (casting) {
                      casting.destroy();
                      casting = null;
                    }
                    casting = new Player(
                      this.state.data.enclosures[0].url,
                      playbackOptions,
                    );
                  }

                  if (this.state.playing) {
                    this.setState({ playing: false });
                    casting.pause();
                  } else {
                    this.setState({
                      playing: this.state.data.enclosures[0].url,
                    });
                    casting.play().on('ended', () => {});
                  }

                  this.setState({
                    hasPlayedThisTrack: this.state.data.enclosures[0].url,
                  });
                }}>
                {this.state.playing === this.state.data.enclosures[0].url ? (
                  <Icon
                    name="pause"
                    size={50}
                    style={{ backgroundColor: 'transparent' }}
                  />
                ) : (
                  <Icon
                    name="play-arrow"
                    size={50}
                    style={{ backgroundColor: 'transparent' }}
                  />
                )}
              </PlainFab>
              <View
                style={{
                  flexWrap: 'wrap',
                  flexDirection: 'row',
                  width: width - 80,
                }}>
                <MKSlider
                  ref="sliderWithValue"
                  min={0}
                  max={Math.round(casting.duration / 1000)}
                  value={casting.currentTime / 1000}
                  style={[styles.slider, { width: width - 80 }]}
                  onChange={curValue => {
                    casting.seek(curValue * 1000);
                  }}
                />
                <Text style={{ textAlign: 'left' }}>
                  {Math.round(getReadableTime(casting.currentTime).hours)}
                  : {Math.round(getReadableTime(casting.currentTime).minutes)}
                  : {Math.round(getReadableTime(casting.currentTime).seconds)}
                </Text>
                <Text style={{ textAlign: 'right', flex: 1 }}>
                  {Math.round(getReadableTime(casting.duration).hours)}
                  : {Math.round(getReadableTime(casting.duration).minutes)}
                  : {Math.round(getReadableTime(casting.duration).seconds)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      );
    } else {
      return (
        <View>
          <RaisedLoginButton
            onPress={() => {
              google({
                appId: appId,
                callback: callback,
              })
                .then(info => {
                  info.user.subscriptions = [];
                  console.log('Received: New user: ', info.user);

                  AsyncStorage.setItem(
                    'User',
                    JSON.stringify(info.user),
                    () => {
                      this.loadUser(() => {});
                    },
                  );
                })
                .catch(error => {
                  console.error(error);
                });
            }}
          />
        </View>
      );
    }
  }
}

//other things to do:
//TODO: move all inline styles to ./styles/*.js
//TODO: condisionally remove the "episodes" page
//TODO: move all functions and block elements into there own scripts in ./src/*.js
//TODO: fix notifications