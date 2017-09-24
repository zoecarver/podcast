exports.between = (n) => {
  var a = n-10;
  var b = n+10;
  return (n - a) * (n - b) <= 0
}

exports.getReadableTime = (m) => {
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

exports.getHeightOfPSV = (casting, height) => {
  if (casting) {
    return height-95;
  }
  return height - 20;
}

exports.renderDownloads = (show) => {
  var output = [];


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