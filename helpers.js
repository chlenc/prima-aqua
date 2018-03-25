const kb = require('./keyboard-buttons')
const keyboard = require('./keyboard.js');
// const frases = require('./frases');

/*git rm -r --cached FolderName
git commit -m "Removed folder from repository"
git push origin master*/

module.exports = {

    getDateTime(){
        //
        var date = new Date()
        return `${('0' + date.getDate()).slice(-2)}.${('0' + (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()} ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}`
    },
    sendUnit(bot,id,firebase,match,count){
        try{
            firebase.database().ref('goodsById/'+match).once("value", function (snapshot) {
                var values = snapshot.val();
                var isWater;
                if(values===null)
                    return;
                if(values.type.substr(0,5) === 'water')
                     isWater = true;
                else
                    isWater=false;
                bot.sendPhoto(id,values.img,{
                    caption: `<b>${values.title}</b><a>\n\nОписание: ${values.description}\n\nЦена: ${values.price}₽\n\n${values.url}</a>`,
                    parse_mode: 'HTML',
                    reply_markup:{
                        inline_keyboard: [
                            [kb.minus(match,isWater),kb.count(match,count),kb.plus(match,isWater),kb.plus10(match,isWater),kb.del(match)],
                            [kb.basket(match)],
                            [kb.back_to_some_category(values.type),kb.back_to_home]
                        ]
                    }
                })
            }, function (errorObject) {
                //console.log("The read failed: " + errorObject);
            });
        }catch(e){}

    },
    answerCallbackQuery(bot,id,time){
        bot.answerCallbackQuery(id,{
            text:'Пожалуйста, подождите',
            // show_alert: true,
            cache_time: time
        })
    },
    payDeliv(){
        var date = new Date();
        return {
            reply_markup: {
                inline_keyboard: [
                    [{
                       text: getOffsetDate(date,0),
                        callback_data: JSON.stringify({
                            type: 'delivDate',
                            pay: 200,
                            date:getOffsetDate(date,0)
                        })
                    }],
                    [{
                        text: getOffsetDate(date,1),
                        callback_data: JSON.stringify({
                            type: 'delivDate',
                            pay: 200,
                            date:getOffsetDate(date,1)
                        })
                    }],
                    [{
                        text: getOffsetDate(date,2),
                        callback_data: JSON.stringify({
                            type: 'delivDate',
                            pay: 200,
                            date:getOffsetDate(date,2)
                        })
                    }],
                    [kb.basket('back_to_home'),kb.back_to_home]
                ]
            }
        }
    },
    spbDeliv(){
        var dates = getSpbOffsetDate();
        //console.log(dates)
        var key = []
        for(var i = 0; i<dates.length; i++){
            key.push([{
                text: dates[i],
                callback_data: JSON.stringify({
                    type: 'delivDate',
                    date:dates[i]
                })
            }])
        }
        key.push([kb.basket('back_to_home'),kb.back_to_home]);
        return {
            reply_markup: {
                inline_keyboard: key
            }
        }
    },
    murDeliv(){
        var dates = getmurOffsetDate();
        //console.log(dates)
        var key = []
        for(var i = 0; i<dates.length; i++){
            key.push([{
                text: dates[i],
                callback_data: JSON.stringify({
                    type: 'delivDate',
                    date:dates[i]
                })
            }])
        }
        key.push([kb.basket('back_to_home'),kb.back_to_home]);
        return {
            reply_markup: {
                inline_keyboard: key
            }
        }
    }
}
 function getOffsetDate(date,offset,time) {
    if(time == undefined)
        time = '';
     return (('0' + (date.getDate()+offset)).slice(-2) + '.' + ('0' + (date.getMonth() + 1)).slice(-2) + '.' + date.getFullYear()+' '+time)
 }
 
 function getSpbOffsetDate() {
     var out = [];
     var date = new Date();
     for(var i = 0; i<=5;i++){
         var day = (new Date(date.getFullYear(),date.getMonth(),date.getDate()+i)).getDay();
         if(day === 0){
             continue
         }else if(day === 6){
             out.push(getOffsetDate(date,i,'09:00 до 16:00'))
         }else{
             out.push(getOffsetDate(date,i,'09:00 до 16:00'))
             out.push(getOffsetDate(date,i,'17:00 до 22:00'))
         }
     }
     return out
 }
function getmurOffsetDate() {
    var out = [];
    var date = new Date();
    for(var i = 0; i<=5;i++){
        var day = (new Date(date.getFullYear(),date.getMonth(),date.getDate()+i)).getDay();
        if(day === 6){
            out.push(getOffsetDate(date,i,'10:00 до 16:00'))
        }else{
            out.push(getOffsetDate(date,i,'15:00 до 21:00'))
        }
    }
    return out
}