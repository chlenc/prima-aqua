const TelegramBot = require('node-telegram-bot-api');
const token = '527281572:AAHp0Vz4wY5wNAxz3z2gMqkPPqRiLA3-07A';
const bot = new TelegramBot(token, {polling: true});
const helpers = require('./helpers');
const keyboards = require('./keyboard');
const kb = require('./keyboard-buttons');
const frases = require('./frases');
const firebase = require("firebase");
firebase.initializeApp({
    serviceAccount: "./prima-aqua-bot-1d5aa2dbcf84.json",
    databaseURL: "https://my-project-1509718932926.firebaseio.com/"
})
const applicationChatId = '-191272654';

bot.onText(/\/start/, msg => {
    firebase.database().ref('users/'+msg.chat.id).set(msg.chat);
    bot.sendMessage(msg.chat.id, frases.phone, keyboards.phone);
});

bot.onText(/\/echo/, msg => {
    bot.sendMessage(msg.chat.id, msg.chat.id);
});

bot.onText(/\/g(.+)/, (msg, match) => {
    try{
        bot.deleteMessage(msg.chat.id,msg.message_id-1);
    }catch(e){
        //console.log(e.toString())
    }try{
        firebase.database().ref('users/'+msg.chat.id).once("value", function (snapshot) {
            var values = snapshot.val();
            var count;
            try{
                count = values.basket[match[1]].count;
            }catch(e){
                count = 0;
            }
            helpers.sendUnit(bot,msg.chat.id,firebase,match[1],count)

        }, function (errorObject) {
            //console.log("The read failed: " + errorObject);
        });
    }catch(e){

    }

});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if(msg.contact){
        firebase.database().ref('users/'+chatId).update({
            phone_number: msg.contact.phone_number
        });
        bot.sendMessage(
            applicationChatId,
            `${helpers.getDateTime()}\n<b>Новый клиент:</b>\n\nИмя: <a href="tg://user?id=${msg.chat.id}">${msg.chat.first_name}</a>\nНомер: ${msg.contact.phone_number}`,
            {
                parse_mode: 'HTML'
            }
        )
        bot.sendMessage(chatId,frases.welcome(msg.chat.first_name),{
            reply_markup:{
                remove_keyboard: true
            }
        })
        bot.sendMessage(chatId,frases.home,keyboards.home)
    };

});

bot.on('callback_query', query => {
    const {chat, message_id, text} = query.message;
    //console.log(query.data)

    if(query.data === kb.home.order.callback_data){
        bot.sendMessage(chat.id,frases.categories,keyboards.categories)
    }
    else if(query.data === kb.home.action.callback_data){
        firebase.database().ref('actions/').once("value", function (snapshot) {
            var values = snapshot.val();
            // //console.log(JSON.stringify(values,null,4))
            var key = [];
            for(var i = 0; i < values.length; i++){
                key.push([{
                    text: values[i].title,
                    callback_data:  JSON.stringify({
                        type: 'action',
                        id: i
                    })
                }])
            }
            key.push([kb.back_to_home]);
            bot.sendMessage(chat.id,'Актуальные на данный момент акции:',{
                reply_markup: {
                    inline_keyboard: key
                }
            })
        }, function (errorObject) {
            //console.log("The read failed: " + errorObject);
        });
    }
    else if(query.data === kb.back_to_home.callback_data){
        bot.sendMessage(chat.id,frases.home,keyboards.home)
    }
    else if(query.data === kb.back_to_categories.callback_data){
        bot.sendMessage(chat.id,frases.categories,keyboards.categories)
    }
    else if(query.data === kb.submitOrder.callback_data){
        firebase.database().ref('delivery/').once("value", function (snapshot) {
            var values = snapshot.val();
            for(var i = 0; i < values.length; i++){
                for(var j = 0;j < values[i].length; j++){
                        if(values[i][j] !== '🚚 Доставка в пригороды 🏘'){
                            // //console.log(values[i][j].callback_data)
                            values[i][j].callback_data = JSON.stringify({
                                type: 'd',
                                data: values[i][j].callback_data.data
                            });
                        }
                }
            }
            values.push([kb.basket('back_to_home'),kb.back_to_home])
            bot.sendMessage(chat.id,'Выберите район доставки:',{
                reply_markup: {
                    inline_keyboard: values
                }
            })
            return
        }, function (errorObject) {
            //console.log("The read failed: " + errorObject);
        });

    }
    else if(query.data === ' '){
        return
    }
    try{
        var parseQuery = JSON.parse(query.data);
        if(parseQuery.type === 'plus'){
            firebase.database().ref('users/'+chat.id).once("value", function (snapshot) {
                var values = snapshot.val();
                // //console.log(parseQuery);
                var count;
                try{
                    count = values.basket[parseQuery.unit].count+1;
                }catch(e){
                    count = 1;
                }
                firebase.database().ref('users/'+chat.id+'/basket/'+parseQuery.unit).update({
                    count: count
                });
                helpers.sendUnit(bot,chat.id,firebase,parseQuery.unit,count)

            }, function (errorObject) {
                //console.log("The read failed: " + errorObject);
            });
        }
        else if(parseQuery.type === 'plus10'){
            firebase.database().ref('users/'+chat.id).once("value", function (snapshot) {
                var values = snapshot.val();
                // //console.log(parseQuery);
                var count;
                try{
                    count = values.basket[parseQuery.unit].count+10;
                }catch(e){
                    count = 10;
                }
                firebase.database().ref('users/'+chat.id+'/basket/'+parseQuery.unit).update({
                    count: count
                });
                helpers.sendUnit(bot,chat.id,firebase,parseQuery.unit,count)

            }, function (errorObject) {
                //console.log("The read failed: " + errorObject);
            });
        }
        else if(parseQuery.type === 'minus'){
            firebase.database().ref('users/'+chat.id).once("value", function (snapshot) {
                var values = snapshot.val();
                // //console.log(parseQuery);
                var count;
                try{
                    count = values.basket[parseQuery.unit].count-1;
                    // //console.log(count)
                    if(count !== 0){
                        firebase.database().ref('users/'+chat.id+'/basket/'+parseQuery.unit).update({
                            count: count
                        });
                    }else{
                        firebase.database().ref('users/'+chat.id+'/basket/'+parseQuery.unit).remove()
                    }

                }catch(e){
                    count = 0;
                }
                helpers.sendUnit(bot,chat.id,firebase,parseQuery.unit,count)

            }, function (errorObject) {
                //console.log("The read failed: " + errorObject);
            });
        }
        else if(parseQuery.type === 'del'){
            try{
                firebase.database().ref('users/'+chat.id+'/basket/'+parseQuery.unit).remove()
            }catch(e){}
            helpers.sendUnit(bot,chat.id,firebase,parseQuery.unit,0)
        }
        else if(parseQuery.type === 'back_to_some_category'){
            if(parseQuery.unit ==="back_to_home"){
                bot.sendMessage(chat.id,frases.home,keyboards.home)
            }else{
                firebase.database().ref('users/'+chat.id).once("value", function (snapshot) {
                    var values = snapshot.val();
                    var count;
                    try{
                        count = values.basket[parseQuery.unit].count;
                    }catch(e){
                        count = 0;
                    }
                    helpers.sendUnit(bot,chat.id,firebase,parseQuery.unit,count)

                }, function (errorObject) {
                    //console.log("The read failed: " + errorObject);
                });
            }
        }
        else if(parseQuery.type === 'unit'){
            firebase.database().ref('goods/').once("value", function (snapshot) {
                var values = snapshot.val()[parseQuery.unit];
                var msg = ''
                if(values === undefined)
                    msg = '<code>Тут пусто :c</code>';
                else{
                    for(var i = 0; i < values.length; i++)
                        msg+=`<b>${values[i].title}</b> <a>\n Цена: ${values[i].price}₽\n/g${values[i].id}</a>\n\n`;
                }
                bot.sendMessage(chat.id,msg,{
                    parse_mode: 'HTML',
                    reply_markup:{
                        inline_keyboard: [
                            [kb.back_to_categories,kb.back_to_home]
                        ]
                    }
                } )
                // //console.log(JSON.stringify(values,null,4))
            }, function (errorObject) {
                //console.log("The read failed: " + errorObject);
            });
        }
        else if(parseQuery.type === 'basket'){
            helpers.answerCallbackQuery(bot,query.id,500);
            firebase.database().ref('goodsById/').once("value", function (snapshot) {
                var goods = snapshot.val();
                firebase.database().ref('users/'+chat.id).once("value", function (snapshot) {
                    var values = snapshot.val();
                    var msg = '';
                    try{
                        values = values.basket;
                        var sum = 0;
                        for(var temp in values){
                            sum+=((+goods[temp].price)*(+values[temp].count));
                            msg+=(`<b>${goods[temp].title}</b>\n<a>/g${temp}\n${goods[temp].price}₽ X ${values[temp].count} = ${(+goods[temp].price)*(+values[temp].count)}₽\n</a>`)
                        }
                        msg+=`<a>\nВсего: ${sum}₽</a>`
                    }catch(e){
                        msg = '<code>Корзина пуста :c</code>'
                    }
                    bot.sendMessage(chat.id,msg,{
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard:[
                                [kb.submitOrder],
                                [kb.back_to_some_unit(parseQuery.back),
                                kb.back_to_home]
                            ]
                        }
                    })
                }, function (errorObject) {
                    //console.log("The read failed: " + errorObject);
                });

            }, function (errorObject) {
                //console.log("The read failed: " + errorObject);
            });
        }
        else if(parseQuery.type === 'action'){
            firebase.database().ref('actions/').once("value", function (snapshot) {
                var values = snapshot.val();
                // //console.log(JSON.stringify(values,null,4))
                bot.sendPhoto(chat.id,values[parseQuery.id].img,{
                    caption: `${values[parseQuery.id].title}\n\n${values[parseQuery.id].description}\n${values[parseQuery.id].url}`,
                    reply_markup: {
                        inline_keyboard: [
                            [kb.back_to_home]
                        ]
                    }
                })
            }, function (errorObject) {
                //console.log("The read failed: " + errorObject);
            });
        }
        else if(parseQuery.type === 'd'){
            firebase.database().ref('users/'+chat.id).update({
                delivery: parseQuery.data
            });
            if(parseQuery.data === "СПБ - экспресс доставка" || parseQuery.data === "СПБ - удобная доставка"){
                bot.sendMessage(chat.id, ' Выберите дату доставки', helpers.payDeliv())
            }
            else if(parseQuery.data === 'Санкт-Петербург'){
                bot.sendMessage(chat.id, ' Выберите дату и временной интервал доставки', helpers.spbDeliv())
            }
            else if(parseQuery.data === 'Девяткино'){
                bot.sendMessage(chat.id, ' Выберите дату и временной интервал доставки', helpers.murDeliv())
            }
            else{
                helpers.answerCallbackQuery(bot,query.id,500);
                firebase.database().ref('goodsById/').once("value", function (snapshot) {
                    var goods = snapshot.val();
                    firebase.database().ref('users/'+chat.id).once("value", function (snapshot) {
                        var values = snapshot.val();
                        var msg = `${helpers.getDateTime()}\n<strong>Новый заказ:</strong>\n\nИмя: <a
                    href="tg://user?id=${chat.id}">${chat.first_name}</a>\nНомер: ${values.phone_number}\n\n`;
                        var deliv = values.delivery;
                        try{
                            values = values.basket;
                            var sum = 0;
                            for(var temp in values){
                                sum+=((+goods[temp].price)*(+values[temp].count));
                                msg+=(`<b>${goods[temp].title}</b>\n<a
                            >/g${temp}\n${goods[temp].price}₽ X ${values[temp].count} = ${(+goods[temp].price)*(+values[temp].count)}₽\n</a>`)
                            }
                            msg+= `\n<b>Доставка:</b><a> ${deliv} </a>`
                            msg+=`<b>\nВсего:</b><a> ${sum}₽</a>`
                        }catch(e){}
                        if(sum !== 0){
                            bot.sendMessage(applicationChatId,msg,{parse_mode: 'HTML'});
                            try{firebase.database().ref('users/'+chat.id+'/basket/').remove()}catch(e){};
                            bot.sendMessage(chat.id,'Заказ принят ✅',keyboards.home);
                        }else{
                            bot.sendMessage(chat.id,'Корзина пуста ',keyboards.home);
                        }


                    }, function (errorObject) {
                        //console.log("The read failed: " + errorObject);
                    });

                }, function (errorObject) {
                    //console.log("The read failed: " + errorObject);
                });
            }
        }
        else if(parseQuery.type === 'delivDate'){
            helpers.answerCallbackQuery(bot,query.id,500);
            firebase.database().ref('goodsById/').once("value", function (snapshot) {
                var goods = snapshot.val();
                firebase.database().ref('users/'+chat.id).once("value", function (snapshot) {
                    var values = snapshot.val();
                    var msg = `${helpers.getDateTime()}\n<strong>Новый заказ:</strong>\n\nИмя: <a
                    href="tg://user?id=${chat.id}">${chat.first_name}</a>\nНомер: ${values.phone_number}\n\n`;
                    var deliv = values.delivery;
                    try{
                        values = values.basket;
                        var sum = 0;
                        for(var temp in values){
                            sum+=((+goods[temp].price)*(+values[temp].count));
                            msg+=(`<b>${goods[temp].title}</b>\n<a
                            >/g${temp}\n${goods[temp].price}₽ X ${values[temp].count} = ${(+goods[temp].price)*(+values[temp].count)}₽\n</a>`)
                        }
                        if(parseQuery.pay === undefined)
                            parseQuery.pay = 0;
                        msg+= `\n<b>Доставка:</b><a> ${deliv} на ${parseQuery.date} = ${parseQuery.pay}₽</a>`
                        msg+=`<b>\nВсего:</b><a> ${sum+parseQuery.pay}₽</a>`
                    }catch(e){}
                    if(sum !== 0){
                        bot.sendMessage(applicationChatId,msg,{parse_mode: 'HTML'});
                        try{firebase.database().ref('users/'+chat.id+'/basket/').remove()}catch(e){};
                        bot.sendMessage(chat.id,'Заказ принят ✅',keyboards.home);
                    }else{
                        bot.sendMessage(chat.id,'Корзина пуста ',keyboards.home);
                    }


                }, function (errorObject) {
                    //console.log("The read failed: " + errorObject);
                });

            }, function (errorObject) {
                //console.log("The read failed: " + errorObject);
            });
        }
    }catch(e){}
    try{
        bot.deleteMessage(chat.id,message_id);
    }catch(e){console.log('delete error')}

});


console.log('bot has been started')