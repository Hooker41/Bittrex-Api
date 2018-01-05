
var intervalId;
var elapsedTime = 0;   //ms
var frequency = 1000; //ms
var timePeriod = 0;  //ms
var watchPrice = 0;
var currentBid = 0;
var currentAsk = 0;
var markethistory = [];

var overpriced = false;
var isTracking = false;
var trackingTerm = 0; //0=BID, 5 = ASK
var find = false;
var topRowdata = [];

var preBTC = 0;
var preLTC = 0;

function onTrackBid(){
    trackingTerm = 0;
    $('#btn-drop').text("BID");
}
function onTrackAsk(){
    trackingTerm = 5;
    $('#btn-drop').text("ASK");
}
var table1 = $('#myTable1').DataTable({
    pageLength: 10,
    searching: false,
    paging: false,
});
var table = $('#myTable').DataTable({
    pageLength: 10,
    order: [[ 2, "desc" ]],
    searching: false,
    paging: false,
    "createdRow": function( row, data, dataIndex){
        // if(isTracking){
        
        watchPrice = $('#price').val();
        if(watchPrice > 0){
            //watching BID or ASK
            if( data[trackingTerm] > watchPrice){
                if(trackingTerm == 0)       //watching BID
                {
                    $(row).find('td:eq(0)').css({"color":"red", "font-size":20});
                    $(row).find('td:eq(1)').css({"color":"red", "font-size":20});
                    $(row).find('td:eq(2)').css({"color":"red", "font-size":20});
                }
                if(trackingTerm == 5)       //watching BID
                {
                    $(row).find('td:eq(3)').css({"color":"red", "font-size":20});
                    $(row).find('td:eq(4)').css({"color":"red", "font-size":20});
                    $(row).find('td:eq(5)').css({"color":"red", "font-size":20});
                }
                
                if(!find)
                {
                    find = true;
                    topRowdata = data;
                    
                    if(trackingTerm == 0)       //watching BID
                    {
                        if(preBTC != data[2] || preLTC != data[1])
                        {
                            startkNewCrono();
                            preBTC = data[2];
                            preLTC = data[1];
                        }
                    }
                    if(trackingTerm == 5)       //watching ASK
                    {
                        if(preBTC != data[3] || preLTC != data[4])
                        {
                            startkNewCrono();
                            preBTC = data[3];
                            preLTC = data[4];
                        }
                    }
                    
                }
            }
        }
        // }
    }
});
function startkNewCrono(){
    console.log("TopData="+topRowdata);
    var localwatchprice = watchPrice;
    var period = $('#timeperiod').val() * 60000;
    
    var cnt = 0;
    if(period > 0)
    {
        var curBTC = 0;
        var curLTC = 0;
        var newInterval = setInterval(function(){
            period-=1000;
            $.post("/", { dataObj: {pair: 'BTC-LTC', tg_api:'markethistory'} }, function(res){
                var buysell = "SELL";

                if(trackingTerm == 0)   // BID
                    buysell = "SELL";
                if(trackingTerm == 5)   // ASK
                    buysell = "BUY";

                markethistory = res.result;
                for(var i = 0; i < 100; i++)
                {
                    var historydata = markethistory[i];
                    if(historydata.OrderType == buysell)    // BID->SELL  ASK ->BUY
                    {
                        if(buysell == "SELL")
                        {
                            if(historydata.Price >= topRowdata[2])
                            {
                                cnt++;
                                curBTC = topRowdata[2];
                                curLTC = topRowdata[1];
                                console.log(historydata.OrderType + ":" + historydata.Price);
                            }
                        }
                        if(buysell == "BUY")
                        {
                            if(historydata.Price >= topRowdata[3])
                            {
                                cnt++;
                                curBTC = topRowdata[3];
                                curLTC = topRowdata[4];
                                console.log(historydata.OrderType + ":" + historydata.Price);
                            }
                        }
                    }
                }
            });
            console.log(period);
            if(period <= 0)
            {
                clearInterval(newInterval);
                if(cnt > 0)
                {
                    console.log(newInterval + ":"+cnt);
                    var type;
                    if(trackingTerm == 0)   // BID
                        type = "BID";
                    if(trackingTerm == 5)   // ASK
                        type = "ASK";

                    table1.row.add( [
                        type,
                        localwatchprice,
                        curBTC,
                        curLTC,
                        (curBTC * curLTC).toFixed(4)
                      ] ).draw( false );
                }
            }
        }, 1000);
    }
    else{
        alert("Set the Period");
    }
}
intervalId = setInterval(function(){
    $.post("/", { dataObj: {pair: 'BTC-LTC', tg_api:'orderbook'} }, function(res){
        
        table.clear().draw();

        var buyAry = res.result.buy;
        var sellAry = res.result.sell;
        
        var cnt = buyAry.length;
        find = false;
        for( var i = 0; i < 10; i++)
        {
            var buyOrderRate = buyAry[i].Rate;
            var buyOrderQuantity = buyAry[i].Quantity;
            var sellOrderRate = sellAry[i].Rate;
            var sellOrderQuantity = sellAry[i].Quantity;
            
            table.row.add( [
                (buyOrderQuantity * buyOrderRate).toFixed(4),
                buyOrderQuantity.toFixed(8),
                buyOrderRate.toFixed(8),
                sellOrderRate.toFixed(8),
                sellOrderQuantity.toFixed(8),
                (sellOrderQuantity * sellOrderRate).toFixed(4)
              ] ).draw( false );
        }
    });

    $.post("/", { dataObj: {pair: 'BTC-LTC', tg_api:'ticker'} }, function(res){
        currentBid = res.result.Bid;
        currentAsk = res.result.Ask;
        $('h1#bidlabel').text('Bid: ' + currentBid );
        $('h1#asklabel').text('Ask: ' + currentAsk );
    });
    
    if(isTracking)
    {
        // var rows_cnt = table.rows().count();
        // var find = false;
        
        // for( var i = 0; i < rows_cnt; i++){
        //     // $('tbody tr:nth-child('+(i+1)+')').css('color', 'black');
        //     var quantity = $('tbody tr:nth-child('+(i+1)+') td:nth-child('+1+')').html();
        //     if(quantity >= watchPrice)
        //     {
        //         $('tbody tr:nth-child('+(i+1)+')').css('color', 'red');
        //     }
        // }

        // elapsedTime += frequency;
        // if(elapsedTime > timePeriod)
        // {   
        //     onTrackEnd();
        // }
        // else
        // {
        //     if(currentBid >= watchPrice)
        //     {
        //         overpriced = true;
        //         $("#progressLabel").text("Bingo! Over priced");
        //     }
        // }
    }

}, frequency);

function onTrackEnd()
{
    // if(!overpriced)
    //     $("#progressLabel").text("Track Finished! Never over priced.");

    isTracking = false;
    $('#btn_start').text('Start Track');
    $('#btn_start').attr('aria-pressed', false);
}

function onTrackStart()
{
    $('#btn_start').text('Stop Track');
    // $("#progressLabel").text("Watching...");

    // timePeriod = $('#timeperiod').val() * 60000;

    // elapsedTime = 0;
    // overpriced = false;
    isTracking = true;
}
function onTrackClick()
{
    var state = $('#btn_start').attr('aria-pressed');

    if(state == 'false')                                //Start Track
        onTrackStart();
    else                                                //End Track
        onTrackEnd();
}