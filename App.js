var ip = 'cocoacast.herokuapp.com';
var port = ''; //:3000

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
import { ScrollView } from 'react-native'
import AddPaging from 'react-native-paged-scroll-view/index'
import Icon from 'react-native-vector-icons/MaterialIcons';
import { google, facebook, twitter, tumblr } from 'react-native-simple-auth';
import { AsyncStorage } from 'react-native';
import Storage from 'react-native-storage';
import RNFS from 'react-native-fs';
import PushNotification from 'react-native-push-notification';
import WS from 'react-native-websocket';
import {
    Player,
    Recorder,
    MediaStates
} from 'react-native-audio-toolkit';
import importSyles from './styles'
import renderSubs from './routs/renderSubs'

let {height, width} = Dimensions.get('window');
const styles = importSyles(width, height)

const MK = require('react-native-material-kit');
const PagedScrollView = AddPaging(ScrollView) //error prone switch to var;
const {
  MKButton,
  MKSpinner,
  MKColor,
} = MK;
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
  .withTextInputStyle({flex: 1})
  .build();

const playbackOptions={
    autoDestroy : true,
    continuesToPlayInBackground : true,
};
let casting;
let storage = new Storage({
    size: 1000,
    storageBackend: AsyncStorage,
    defaultExpires: 1000 * 3600 * 24,
    enableCache: true,
    sync : {
    }
})

PushNotification.configure({
    onNotification: function(notification) {
        console.log( 'NOTIFICATION:', notification );
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
    }

    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidMount(){
    this.loadUser(() => {
      console.log('user', this.state.user);
      this.loadSubs()
    })

    AsyncStorage.getItem('Offline', (err, result) => {
      if (result) {
        this.setState({downloadedShows: JSON.parse(result)})
      }else{
        AsyncStorage.setItem('Offline', JSON.stringify([]), () => {
          this.setState({downloadedShows: []})
        });
      }
    })
  }

  loadSubs(){
    console.log('loading subs');
    fetch('http://' + ip + port + '/load', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.user,
      })
    })
    .then((response) => {
      return response.json();
    })
    .then((responseJson) => {
      console.log('successfully loaded json: ', responseJson);
      this.setState({subs: responseJson.arr, loaded: true});
    })
    .catch((error) => {
      console.error(error);
    });
  }

  downloadAudioFile(url, item) {
    var tmpArr = this.state.currentlyDownloading;
    tmpArr.push(item.title);
    this.setState({currentlyDownloading: tmpArr});
    console.log(item);
    var urlName = url.split('/').slice(-1)[0]
    console.log('name ', urlName);
    RNFS.downloadFile({
      fromUrl: url,
      toFile: `${RNFS.DocumentDirectoryPath}/` + urlName,
    }).promise.then((r) => {
      console.log('finished downloading');

      console.log(`${RNFS.DocumentDirectoryPath}/` + urlName); //

      AsyncStorage.getItem('Offline', (err, result) => {
        var jsonRes = JSON.parse(result);
        console.log('jsonRes ', jsonRes);
        item.enclosures[0].url = `${RNFS.DocumentDirectoryPath}/` + urlName;
        console.log('new item ', item);

        if (Array.isArray(jsonRes)) {
          jsonRes.push(item);
        }else{
          jsonRes = [item];
        }

        console.log('saving ', jsonRes);

        AsyncStorage.setItem('Offline', JSON.stringify(jsonRes), () => {
          var index = tmpArr.indexOf(item.title);
          if (index > -1) {
              tmpArr.splice(index, 1);
          }
          this.setState({currentlyDownloading: tmpArr});
          AsyncStorage.getItem('Offline', (err, result) => {
            this.setState({downloadedShows: JSON.parse(result)})
          })
          //maybe do something here at somepoint...
        });
      })
    })
  }

  loadUser(callback){
    AsyncStorage.getItem('User', (err, result) => {
      if (result) {
        this.setState({user: JSON.parse(result)}, () => {
          callback();
        })
      }else{
        this.setState({user: false})
      }
    });
  }

  loadOffline(){
    AsyncStorage.getItem('User', (err, result) => {
      this.setState({offline: JSONG.parse(results)})
    })
  }

  subscribe(name) {
    fetch('http://' + ip + port + '/subscribe', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: this.state.user.id,
        podId: name
      })
    })
    .then((response) => response.json())
    .then((responseJson) => {
      AsyncStorage.setItem('User', JSON.stringify(responseJson), () => {
        this.loadUser(() => {this.loadSubs()});
      });
    })
    .catch((error) => {
      console.error(error);
    });
  }

  unSubscribe(name) {
    fetch('http://' + ip + port + '/unsubscribe', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: this.state.user.id,
        podId: name
      })
    })
    .then((response) => response.json())
    .then((responseJson) => {
      AsyncStorage.setItem('User', JSON.stringify(responseJson), () => {
        this.loadUser(() => {this.loadSubs()});
      });
    })
    .catch((error) => {
      console.error(error);
    });
  }

  getEppisodeName(title) {
    if (isNaN(parseInt(title))) {
      if (title.split(' ').length > 2) {
        for (var i = 0; i < 3; i++) {
          if (!isNaN(parseInt(title.split(' ')[i]))) {
            return parseInt(title.split(' ')[i]);
          }else if(title.split(' ')[i].includes('#')){
            console.log(title.split(' ')[i].split('#'));
            for (var x = 0; x < title.split(' ')[i].split('#').length; x++) {
              if (!isNaN(parseInt(title.split(' ')[i].split('#')[x]))) {
                return parseInt(title.split(' ')[i].split('#')[x]);
              }
            }
          }
        }
      }else{
        for (var i = 0; i < title.split(' ').length; i++) {
          if (!isNaN(parseInt(title.split(' ')[i]))) {
            return parseInt(title.split(' ')[i]);
          }else if(title.split(' ')[i].includes('#')){
            console.log(title.split(' ')[i].split('#'));
            for (var x = 0; x < title.split(' ')[i].split('#').length; x++) {
              if (!isNaN(parseInt(title.split(' ')[i].split('#')[x]))) {
                return parseInt(title.split(' ')[i].split('#')[x]);
              }
            }
          }
        }
      }
      return title.split(' ')[0].split('')[0]
    }else{
      return parseInt(title)
    }
  }

  componentWillUpdate(){
    if (casting && casting.isPrepared){
      //alert('isplaying4real')
      //do something here to update where the audio slider is
    }
  }

  handleScroll(event){
    if (event.nativeEvent.contentOffset.y > 199) {
      this.setState({showName: true})
    }else{
      this.setState({showName: false})
    }
  }

  between(n) {
    var a = n-10;
    var b = n+10;
    return (n - a) * (n - b) <= 0
  }

  getReadableTime(m){
    console.log('s: ', Math.round((m/1000)%60));
    console.log('m: ', Math.round((m/(1000*60))%60));
    console.log('h: ', Math.round((m/(1000*60*60))%24));
    if (m > 0) {
      return {
        seconds:(m/1000)%60,
        minutes:(m/(1000*60))%60,
        hours:(m/(1000*60*60))%24,
      };
    }else{
      return {
        seconds:0,
        minutes:0,
        hours:0,
      };
    }
  }

  getHeightOfPSV(){
    if (casting) {
      return height-95;
    }
    return height - 20;
  }

  renderDownloads() {
    var output = [];
    var show = this.state.downloadedShows;


    if (show) {
      show.forEach((data, i) => {
        if (data.enclosures) {
          output.push(
            data
          )
        }
      })

      return output;
    }
  }

  _onChecked(event){
    this.setState({checked: event});
  }

  renderEpisode(show){
    var output = [];
    var show = this.state.show;
    // console.log('log for inclueds ', this.state.downloadedShows);
    //
    // if (!this.state.downloadedShows) {
    //   AsyncStorage.getItem('Offline', (err, result) => {
    //     console.log('result ', result);
    //     if (!result) {
    //       this.setState({downloadedShows: []})
    //     }else{
    //       this.setState({downloadedShows: JSON.parse(result)})
    //     }
    //   })
    // }

    if (show) {
      show.items.forEach((data, i) => {
        if (data.enclosures) {
          output.push(
            <View style={{
                width: width - 10,
                flexWrap: 'wrap',
                backgroundColor: 'white',
                alignItems: 'flex-start',
                flexDirection:'row',
                elevation: 5,
                margin: 5
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
                  if (this.state.hasPlayedThisTrack !== data.enclosures[0].url) {
                    this.setState({data: data})
                    if (casting) {
                      casting.destroy() //handle error at some point
                      casting = null;
                    }
                    casting = new Player(data.enclosures[0].url, playbackOptions)
                  }

                  if (this.state.playing) {
                    this.setState({playing: false});
                    casting.pause();
                  }else{
                    this.setState({playing: data.enclosures[0].url});
                    casting.play()
                    .on('ended', () => {
                      // Enable button again after playback finishes
  //                    this.setState({disabled: false});
                    });
                  }

                  this.setState({hasPlayedThisTrack: data.enclosures[0].url})
                }}
              >
              {
                (this.state.playing === data.enclosures[0].url) ?
                  <Icon name="pause" size={50} style={{backgroundColor: 'transparent'}} /> :
                  <Icon name="play-arrow" size={50} style={{backgroundColor: 'transparent'}} />
              }
              </PlainFab>
              <View style={{width: width - 90, textAlign: 'left'}}>
                <Text style={[styles.legendLabel, {marginTop: 25, textAlign: 'left'}]}>{data.title}</Text>
                  <MKSwitch  checked={(this.state.downloadedShows.includes(data.enclosures[0].url.split('/').slice(-1)[0])) ? true : false}
                    onCheckedChange={(e) => {
                      AsyncStorage.getItem('Offline', (err, result) => {
                        console.log('has gotten item and stufffff');
                        var jsonRes = JSON.parse(result);

                        if (Array.isArray(jsonRes)) {
                          console.log('its an array');
                          if (e.checked) {
                            console.log('we is downloading it');
                            this.downloadAudioFile(data.enclosures[0].url, data);
                            var tmpArr = this.state.downloadedShows;
                            tmpArr.push(data.enclosures[0].url.split('/').slice(-1)[0]);
                            this.setState({downloadedShows: tmpArr});
                          }else{
                            console.log('there is a problem cuz we are trying to delte it');
                            for (var i = 0; i < jsonRes.length; i++) {
                              var path = data.enclosures[0].url.split('/').slice(-1)[0];
                              if (jsonRes[i].enclosures[0].url.split('/').slice(-1)[0] === path) {
                                jsonRes.splice(i, 1);

                                RNFS.unlink(path)
                                .then(() => {
                                  console.log('FILE DELETED');
                                })
                                // `unlink` will throw an error, if the item to unlink does not exist
                                .catch((err) => {
                                  console.log(err.message);
                                });
                              }
                            }
                            console.log('saving ', jsonRes);

                            AsyncStorage.setItem('Offline', JSON.stringify(jsonRes), () => {
                              //maybe do something here at somepoint...
                              var tmpArr = this.state.downloadedShows;
                              console.log('tmpArr1', tmpArr);
                              tmpArr.splice(tmpArr.indexOf(data.enclosures[0].url.split('/').slice(-1)[0]), 1);
                              console.log('tmpArr', tmpArr);
                              this.setState({downloadedShows: tmpArr});
                            });
                          }
                        }else{

                        }
                      })
                    }}
                    />
              </View>
            </View>
          )
        }
      })
    }

    return output;
  }

  render() {
    var downloads = [];
    var toMap = this.renderDownloads();
    console.log('tomap ', toMap);

    if (Array.isArray(toMap)) {
      console.log(toMap);
      toMap.forEach((data, i) => {
        console.log('DATA', data);
        downloads.push(
          <View
            key={i}
            style={{
              width: width - 10,
              flexWrap: 'wrap',
              backgroundColor: 'white',
              alignItems: 'flex-start',
              flexDirection:'row',
              elevation: 5,
              margin: 5
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
                if (this.state.hasPlayedThisTrack !== data.enclosures[0].url) {
                  this.setState({data: data})
                  if (casting) {
                    casting.destroy() //handle error at some point
                    casting = null;
                  }
                  casting = new Player(data.enclosures[0].url, playbackOptions)
                }

                if (this.state.playing) {
                  this.setState({playing: false});
                  casting.pause();
                }else{
                  this.setState({playing: data.enclosures[0].url});
                  casting.play()
                  .on('ended', () => {
                    // Enable button again after playback finishes
      //                    this.setState({disabled: false});
                  });
                }

                this.setState({hasPlayedThisTrack: data.enclosures[0].url})
              }}
            >
            {
              (this.state.playing === data.enclosures[0].url) ?
                <Icon name="pause" size={50} style={{backgroundColor: 'transparent'}} /> :
                <Icon name="play-arrow" size={50} style={{backgroundColor: 'transparent'}} />
            }
            </PlainFab>
            <View style={{width: width - 90, textAlign: 'left'}}>
              <Text style={[styles.legendLabel, {marginTop: 25, textAlign: 'left'}]}>{data.title}</Text>
                <MKSwitch  checked={(this.state.downloadedShows.includes(data.enclosures[0].url.split('/').slice(-1)[0])) ? true: false}
                  onCheckedChange={(e) => {
                    AsyncStorage.getItem('Offline', (err, result) => {
                      var jsonRes = JSON.parse(result);

                      if (Array.isArray(jsonRes)) {
                        if (e.checked) {
                          this.downloadAudioFile(data.enclosures[0].url, data);
                          var tmpArr = this.state.downloadedShows;
                          tmpArr.push(data.enclosures[0].url.split('/').slice(-1)[0]);
                          this.setState({downloadedShows: tmpArr});
                        }else{
                          for (var i = 0; i < jsonRes.length; i++) {
                            var path = data.enclosures[0].url.split('/').slice(-1)[0];
                            if (jsonRes[i].enclosures[0].url.split('/').slice(-1)[0] === path) {
                              jsonRes.splice(i, 1);

                              RNFS.unlink(path)
                              .then(() => {
                                console.log('FILE DELETED');
                              })
                              // `unlink` will throw an error, if the item to unlink does not exist
                              .catch((err) => {
                                console.log(err.message);
                              });
                            }
                          }
                          console.log('saving ', jsonRes);

                          AsyncStorage.setItem('Offline', JSON.stringify(jsonRes), () => {
                            //maybe do something here at somepoint...
                            var tmpArr = this.state.downloadedShows;
                            console.log('tmpArr1', tmpArr);
                            tmpArr.splice(tmpArr.indexOf(data.enclosures[0].url.split('/').slice(-1)[0]), 1);
                            console.log('tmpArr', tmpArr);
                            this.setState({downloadedShows: tmpArr});
                          });
                        }
                      }

                    })
                  }}
                  />
            </View>
          </View>
        )
      })
    }

    this.state.currentlyDownloading.forEach((data) => {
      downloads.push(<Text>DOWNLOADING: </Text>)
      downloads.push(
        <Text>{data}</Text>
      )
    })

    if (this.state.user) {
      return(
        <View>
        <PagedScrollView
          keyboardShouldPersistTaps={true}
          style={{height: this.getHeightOfPSV(), backgroundColor: '#F5FCFF',}}
          ref={(pages) => { this.PagedScrollView = pages }}
          onInitialization={() => {
            //this.PagedScrollView.scrollToPage(width, 0, false)
          }}
          pagingEnabled={true}
          horizontal={true}>
            <WS
              ref={ref => {this.ws = ref}}
              url={'ws://' + ip + port + ''}
              onOpen={() => {
                if (this.state.user.id) {
                  this.ws.send(this.state.user.id);
                  console.log('open');
                }else{
                  this.ws.send('start')
                  console.log('close');
                }
              }}
              onMessage={(msg) => {
                //dosomthing
                console.log(msg);
                var data = msg.data;
                if (data !== 'start') {
                  data = JSON.parse(data);
                  console.log(data);

                  PushNotification.localNotification({
                    /* iOS and Android properties */
                    title: 'New episode of ' + data.title, // (optional, for iOS this is only used in apple watch, the title will be the app name on other iOS devices)
                    message: data.new.items[0].title, // myabe change this later to get ALL new episodes
                  });
                }
              }}
            />
            <ScrollView styles={{width:width}} onScroll={this.handleScroll} keyboardShouldPersistTaps={true} >
              <View style={{width: width, backgroundColor:MKColor.BlueGrey, height: 75, justifyContent: 'space-between',}}>
                <Text style={{fontSize: 24, marginTop: 25.5, fontWeight: '800', textAlign: 'center'}}>Downloads</Text>
              </View>
              <View style={{
                width:width,
                flexDirection: 'row',
                flexWrap: 'wrap'
              }}>
                {downloads}
              </View>
            </ScrollView>
          <ScrollView styles={{width:width}} keyboardShouldPersistTaps={true}>
            <View style={{flexWrap: 'wrap', flexDirection:'row'}}>
              <Textfield onChangeText={(text) => this.setState({search: text})} />
              <TouchableOpacity
                onPress={() => {
                  this.setState({loaded: false});
                  fetch('http://' + ip + port + '/search/' + this.state.search)
                    .then((response) => response.json())
                    .then((responseJson) => {
                      //console.log(responseJson);
                      this.setState({subs: [responseJson], loaded: true});
                    })
                    .catch((error) => {
                      console.error(error);
                    });
                }}
                >
                <Icon name="search" size={30} style={{backgroundColor: 'transparent', marginTop: 15}} />
              </TouchableOpacity>
            </View>
            <View style={[{
              justifyContent: 'center',
              alignItems: 'center',
            }, styles.container]}>
              {renderSubs(this.state, (renderSubsData, artworkUrl600, title) => {
                      console.log('errors');
                      console.log(renderSubsData + "_" + artworkUrl600, title);
                      this.setState({show: renderSubsData, currentShow: artworkUrl600, nameOfShow: title}, () => {
                        console.log('SHOW ', this.state.show);
                      })
                      this.PagedScrollView.scrollToPage(width*2, 0, true)
                    })}
            </View>
            <FlatHomeButton
              onPress={() => {
                this.setState({loaded: false});
                this.loadSubs();
              }}/>
            <FlatLogoutButton
                onPress={() => {
                  google({
                    appId: '893909331909-5tvkbj2gqsvi2gfvpg3rekdm1al68kfg.apps.googleusercontent.com',
                    callback: 'com.googleusercontent.apps.893909331909-5tvkbj2gqsvi2gfvpg3rekdm1al68kfg:/oauth2redirect',
                  }).then((info) => {
                    info.user.subscriptions = [];
                    console.log('google u: ', info.user);

                    AsyncStorage.setItem('User', JSON.stringify(info.user), () => {
                      this.loadUser(() => {console.log('fml')});
                    });

                  }).catch((error) => {
                    console.log('ERROR', error);
                  });
                }}
            />
          </ScrollView>
          <View>
            {
              (this.state.showName) ?
              <View style={{width: width, backgroundColor:MKColor.BlueGrey, height: 75, justifyContent: 'space-between',}}>
                <Text style={{fontSize: 24, marginTop: 25.5, fontWeight: '800', textAlign: 'center'}}>{this.state.nameOfShow}</Text>
              </View>
              : null
            }
            <ScrollView styles={{width:width}} onScroll={this.handleScroll} keyboardShouldPersistTaps={true} >
              <Image source={{uri: this.state.currentShow}} style={{width:width, height: 200}}/>
              <View style={{
                width:width,
                flexDirection: 'row',
                flexWrap: 'wrap'
              }}>
                {this.renderEpisode()}
              </View>
            </ScrollView>
          </View>
        </PagedScrollView>
          {
            (casting) ?
            <View style={{width: width, backgroundColor:MKColor.BlueGrey, height: 75, flexWrap: 'wrap'}}>
              <PlainFab
                style={{
                  height: 50,
                  borderRadius: 25,
                  width: 50,
                  margin: 10,
                }}
                onPress={() => {
                  if (this.state.hasPlayedThisTrack !== this.state.data.enclosures[0].url) {
                    if (casting) {
                      casting.destroy() //handle error at some point
                      casting = null;
                    }
                    casting = new Player(this.state.data.enclosures[0].url, playbackOptions)
                  }

                  if (this.state.playing) {
                    this.setState({playing: false});
                    casting.pause();
                  }else{
                    this.setState({playing: this.state.data.enclosures[0].url});
                    casting.play()
                    .on('ended', () => {
                      // Enable button again after playback finishes
  //                    this.setState({disabled: false});
                    });
                  }

                  this.setState({hasPlayedThisTrack: this.state.data.enclosures[0].url})
                }}
              >
              {
                (this.state.playing === this.state.data.enclosures[0].url) ?
                  <Icon name="pause" size={50} style={{backgroundColor: 'transparent'}} /> :
                  <Icon name="play-arrow" size={50} style={{backgroundColor: 'transparent'}} />
              }
              </PlainFab>
              <View style={{flexWrap: 'wrap', flexDirection:'row', width: width-80}}>
                <MKSlider
                  ref="sliderWithValue"
                  min={0}
                  max={Math.round(casting.duration/1000)}
                  value={(casting.currentTime)/1000}
                  style={[styles.slider, {width: width-80}]}
                  onChange={(curValue) => {
                    casting.seek(curValue*1000);
                  }}
                />
                <Text style={{textAlign: 'left'}}>
                  {Math.round(this.getReadableTime(casting.currentTime).hours)}
                : {Math.round(this.getReadableTime(casting.currentTime).minutes)}
                : {Math.round(this.getReadableTime(casting.currentTime).seconds)}
                </Text>
                <Text style={{textAlign: 'right', flex:1,}}>
                  {Math.round(this.getReadableTime(casting.duration).hours)}
                : {Math.round(this.getReadableTime(casting.duration).minutes)}
                : {Math.round(this.getReadableTime(casting.duration).seconds)}
                </Text>
              </View>
            </View>
            : null
          }
        </View>
      );
    }else{
      return (
        <View>
          <RaisedLoginButton
            onPress={() => {
              console.log('starting login');
              google({
                appId: '****',
                callback: '****',
              }).then((info) => {
                info.user.subscriptions = [];
                console.log('google u: ', info.user);

                AsyncStorage.setItem('User', JSON.stringify(info.user), () => {
                  this.loadUser(() => {});
                });

              }).catch((error) => {
                console.log('ERROR', error);
              });
            }}
          />
        </View>
      )
    }
  }
}