# Cocoacast

### This is a react-native podcast app that anyone is welcome to contribute to and use.

## Please Note
This app has been a side project for me for a while, it is **in no way** complete. They code may be repetitive and messy and many of the features may be broken. At some point I will clean up the code and fix all the broken features, but for now use at your own risk.

## Usage
### Currently
Right now this app is not even in alpha. This means that it is also not in the play store, so you have to build it yourself.

### How to run
1. clone this repo:
```bash
git clone git@github.com:pudility/podcast.git
```
2. install dependencies
```bash
npm install
```
3. add `local.properties` (on mac)
```bash
echo "sdk.dir = /Users/<yourname>/Library/Android/sdk" > android/local.properties
```
4. Set up google with [react-native-simple-auth](https://github.com/adamjmcgrath/react-native-simple-auth#google)
5. run the app!
```bash
react-native run-android
```

## TODO
You will see that there are **lots** of things to do. `App.js` contains comments with `//TODO: <task>`. We really appreciate any help you can give us!

## Contributing
Currently there are no contributing guidelines.

## Server
Mainly for security reason the server code is not open source. If you need the server to do something that it is not currently doing, please submit an issue and I will try to add it ASAP.

### Server Endpoints
Given the fact that you cannot see the server code, here are the various endpoints that can be used:

| Endpoint               | Description                              | Body                                     |
| ---------------------- | ---------------------------------------- | ---------------------------------------- |
| `/load`                | Loads the subscriptions of a particular user | `user`: `JSON String` (The full user object stringified) |
| `/subscribe`           | Subscribes user to particular podcast    | - `id`: `String` (the id of the user `user.id`) <br> - `podId`:`String` (the id of a podcast `collectionId`) |
| `/unsubscribe`         | Unsubscribes user to particular podcast  | - `id`: `String` (the id of the user `user.id`) <br> - `podId`:`String` (the id of a podcast `collectionId`) |
| `/search/:search_term` | Searches for a podcast                   | None                                     |



## Project Structure
I will add this part soon.

## Screenshots
![android_screen_req](https://github.com/pudility/podcast/blob/master/screenshots/giphy.gif)