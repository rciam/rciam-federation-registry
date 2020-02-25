const calcDiff = (petition,service) => {
  console.log(petition);
  console.log(service);
}

const addToString = (str,value) =>{
  let sentence='';
  const words = str.split('_');
  words.forEach((item,index)=>{
    if(index==1){
      sentence = sentence + value + '_';
    }
    sentence=sentence + item +'_';
  });
  sentence = sentence.slice(0,-1);
  return sentence
}



module.exports = {
  calcDiff,
  addToString
}
