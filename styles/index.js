import {
  StyleSheet,
} from 'react-native';

export default (width, height) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  fullView: {
    width:width,
    height:height
  },
  textfield: {
    margin: 10,
    marginTop: 20,
    width: width - 60
  },
  fab: {
    flex: 1,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  legendLabel: {
    color: '#666666',
    backgroundColor: 'transparent',
    marginTop: 10,
    marginBottom: 20,
    fontSize: 12,
    fontWeight: '300',
  },
});
